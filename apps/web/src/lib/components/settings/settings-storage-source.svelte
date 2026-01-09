<script lang="ts">
  import { browser } from '$app/environment';
  import DialogTemplate from '$lib/components/dialog-template.svelte';
  import Ripple from '$lib/components/ripple.svelte';
  import { buttonClasses } from '$lib/css-classes';
  import type { BooksDbStorageSource } from '$lib/data/database/books-db/versions/books-db';
  import { gDriveRevokeEndpoint } from '$lib/data/env';
  import { BaseStorageHandler } from '$lib/data/storage/handler/base-handler';
  import { getStorageHandler } from '$lib/data/storage/storage-handler-factory';
  import { StorageOAuthManager, storageOAuthTokens } from '$lib/data/storage/storage-oauth-manager';
  import {
    encrypt,
    type FsHandle,
    isAppDefault,
    isFsHandle,
    isRemoteContext,
    isWebDavContext,
    type RemoteContext,
    type StorageSourceData,
    type StorageSourceSaveResult,
    type StorageUnlockAction
  } from '$lib/data/storage/storage-source-manager';
  import SettingsEncryptionPassword from '$lib/components/settings/settings-encryption-password.svelte';
  import { StorageKey } from '$lib/data/storage/storage-types';
  import { database, isOnline$ } from '$lib/data/store';
  import { createEventDispatcher } from 'svelte';

  export let configuredName: string;
  export let configuredIsSyncTarget: boolean;
  export let configuredIsStorageSourceDefault: boolean;
  export let configuredType: StorageKey;
  export let configuredData: StorageSourceData;
  export let configuredUnlockAction: StorageUnlockAction | undefined;
  export let configuredStoredInManager: boolean;
  export let configuredEncryptionDisabled: boolean;
  export let resolver: (arg0: StorageSourceSaveResult | undefined) => void;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  let containerElm: HTMLElement;
  let nameElm: HTMLInputElement;
  let error = '';
  const passwordManagerAvailable = 'PasswordCredential' in window;
  let storageSourceName = configuredName || '';
  let storageSourceIsSyncTarget = configuredIsSyncTarget || false;
  let storageSourceIsSourceDefault = configuredIsStorageSourceDefault || false;
  let storageSourceType = configuredType || StorageKey.GDRIVE;
  let storageSourceClientId = '';
  let storageSourceClientSecret = '';
  let storageSourceUrl = '';
  let storageSourceUsername = '';
  let storageSourcePassword = '';
  let storageSourceEncryptionPassword = '';
  let directoryHandle: FileSystemDirectoryHandle | undefined = undefined;
  let handleFsPath = '';
  let storageSourceStoredInManager =
    (passwordManagerAvailable && configuredStoredInManager) || false;
  let storageSourceEncryptionDisabled = configuredEncryptionDisabled || false;
  let storageSourceTypes = [
    { key: StorageKey.GDRIVE, label: 'GDrive' },
    { key: StorageKey.ONEDRIVE, label: 'OneDrive' },
    { key: StorageKey.WEBDAV, label: 'WebDAV' }
  ];

  $: if (browser && 'showDirectoryPicker' in window) {
    storageSourceTypes = [...storageSourceTypes, { key: StorageKey.FS, label: 'Filesystem' }];
  }

  $: initializeStorageSourceForm(configuredData);

  function initializeStorageSourceForm(data: StorageSourceData) {
    if (isFsHandle(data)) {
      directoryHandle = data.directoryHandle;
      handleFsPath = data.fsPath;
    }
    if (isRemoteContext(data)) {
      storageSourceClientId = data.clientId;
      storageSourceClientSecret = data.clientSecret;
    }
    if (isWebDavContext(data)) {
      storageSourceUrl = data.url;
      storageSourceUsername = data.username;
      storageSourcePassword = data.password;
    }
  }

  async function selectDirectory() {
    resetCustomValidity();

    try {
      const dirHandle = await window.showDirectoryPicker({
        id: 'ttu-reader-root',
        mode: 'readwrite'
      });
      directoryHandle = await dirHandle.getDirectoryHandle(BaseStorageHandler.rootName, {
        create: true
      });
      handleFsPath = `${dirHandle.name === '\\' ? '' : `${dirHandle.name}/`}${
        BaseStorageHandler.rootName
      }`;
    } catch (err: any) {
      directoryHandle = undefined;
      handleFsPath = '';

      if (err.name !== 'AbortError') {
        error = err.message;
      }
    }
  }

  async function save() {
    resetCustomValidity();

    if (
      ![...containerElm.querySelectorAll('input')].every((elm) => {
        let isValid = elm.reportValidity();

        if (!isValid) {
          return false;
        }

        if (elm === nameElm) {
          if (storageSourceType === StorageKey.FS && !directoryHandle) {
            nameElm.setCustomValidity('You need to select a directory');
            isValid = false;
          } else if (isAppDefault(storageSourceName)) {
            nameElm.setCustomValidity('Please select a different name');
            isValid = false;
          }
        }

        if (!isValid) {
          elm.reportValidity();
        }

        return isValid;
      })
    ) {
      return;
    }

    try {
      const configuredRemoteData: RemoteContext | undefined = isRemoteContext(configuredData)
        ? configuredData
        : undefined;
      const configuredFSData: FsHandle | undefined = isFsHandle(configuredData)
        ? configuredData
        : undefined;
      let storageSourceData: StorageSourceData | undefined = undefined;
      let credentialsChanged = false;
      let invalidateToken = false;

      if (storageSourceStoredInManager) {
        await navigator.credentials
          .store(
            // eslint-disable-next-line no-undef
            new PasswordCredential({
              id: storageSourceName,
              name: `${storageSourceName} (${storageSourceType})`,
              password: storageSourceEncryptionPassword
            })
          )
          .catch(({ message }: any) => {
            throw new Error(`Failed to store Password: ${message}`);
          });
      }

      if (storageSourceType === StorageKey.FS) {
        if (!directoryHandle) {
          throw new Error('Directory handle not defined');
        }

        storageSourceData = { directoryHandle, fsPath: handleFsPath };
      } else if (
        storageSourceType === StorageKey.ONEDRIVE ||
        storageSourceType === StorageKey.GDRIVE
      ) {
        credentialsChanged =
          storageSourceClientId !== configuredRemoteData?.clientId ||
          storageSourceClientSecret !== configuredRemoteData?.clientSecret;
        invalidateToken = !storageSourceClientSecret || credentialsChanged;

        const willInvalidateToken =
          invalidateToken &&
          configuredType === StorageKey.GDRIVE &&
          configuredRemoteData?.refreshToken;

        if (willInvalidateToken && !$isOnline$) {
          throw new Error('You need to be online in order to make this change to the credentials');
        }

        storageSourceData = {
          clientId: storageSourceClientId,
          clientSecret: storageSourceClientSecret,
          refreshToken: invalidateToken ? '' : configuredRemoteData?.refreshToken
        };
      } else if (storageSourceType === StorageKey.WEBDAV) {
        storageSourceData = {
          url: storageSourceUrl,
          username: storageSourceUsername,
          password: storageSourcePassword
        };
      }
      if (storageSourceData === undefined) {
        throw new Error(`Storage source data was undefined`);
      }
      storageSourceData = await handleEncryptionIfNeeded(storageSourceData);
      const toSave: BooksDbStorageSource = {
        name: storageSourceName,
        type: storageSourceType,
        storedInManager: storageSourceStoredInManager,
        encryptionDisabled: storageSourceEncryptionDisabled,
        data: storageSourceData,
        lastSourceModified: Date.now()
      };

      await database.saveStorageSource(
        toSave,
        configuredName,
        storageSourceIsSyncTarget,
        storageSourceIsSourceDefault
      );

      if (
        invalidateToken &&
        configuredType === StorageKey.GDRIVE &&
        configuredRemoteData?.refreshToken
      ) {
        StorageOAuthManager.revokeToken(gDriveRevokeEndpoint, configuredRemoteData.refreshToken);
      }

      if (credentialsChanged) {
        storageOAuthTokens.delete(configuredName);

        if (storageSourceType !== StorageKey.FS) {
          getStorageHandler(window, storageSourceType).clearData();
        }
      }

      if (
        storageSourceType === StorageKey.FS &&
        directoryHandle &&
        !(await configuredFSData?.directoryHandle.isSameEntry(directoryHandle))
      ) {
        getStorageHandler(window, StorageKey.FS).clearData();
      }

      closeDialog({ new: toSave, old: configuredName });
    } catch (err: any) {
      error = err.message;
    }
  }

  function handleEncryptionIfNeeded(data: StorageSourceData): Promise<StorageSourceData> {
    if (storageSourceEncryptionDisabled || isFsHandle(data)) {
      return Promise.resolve(data);
    }

    return encrypt(window, JSON.stringify(data), storageSourceEncryptionPassword);
  }

  function resetCustomValidity() {
    error = '';
    nameElm.setCustomValidity('');
  }

  function closeDialog(data?: StorageSourceSaveResult) {
    resolver(data);
    dispatch('close');
  }
</script>

<DialogTemplate>
  <div
    class="flex flex-col p-2 max-h-[50vh] overflow-auto sm:max-h-[75vh]"
    slot="content"
    bind:this={containerElm}
  >
    <input
      required
      type="text"
      placeholder="Name"
      bind:value={storageSourceName}
      bind:this={nameElm}
    />
    <div class="mt-4 flex items-center">
      <input id="cbx-source" type="checkbox" bind:checked={storageSourceIsSyncTarget} />
      <label for="cbx-source" class="ml-2 mr-6">Is Sync Target</label>
      <input id="cbx-manager" type="checkbox" bind:checked={storageSourceIsSourceDefault} />
      <label for="cbx-source" class="ml-2">Is Source Default</label>
    </div>
    <select
      class="my-4"
      bind:value={storageSourceType}
      on:change={() => {
        if (storageSourceType === StorageKey.FS) {
          storageSourceClientId = '';
          storageSourceClientSecret = '';
          storageSourceStoredInManager = false;
          storageSourceEncryptionDisabled = false;
        } else {
          directoryHandle = undefined;
          handleFsPath = '';
        }
      }}
    >
      {#each storageSourceTypes as sourceType (sourceType.key)}
        <option value={sourceType.key}>
          {sourceType.label}
        </option>
      {/each}
    </select>
    {#if storageSourceType === StorageKey.FS}
      <button class={buttonClasses} on:click={selectDirectory}>
        Select Directory
        <Ripple />
      </button>
      <div class="my-4 text-center">{handleFsPath || 'Nothing selected'}</div>
    {:else if storageSourceType === StorageKey.WEBDAV}
      <input required type="text" placeholder="WebDAV URL" bind:value={storageSourceUrl} />
      <input
        class="mt-4"
        required
        type="text"
        placeholder="WebDAV Username"
        bind:value={storageSourceUsername}
      />
      <input
        class="mt-4"
        type="password"
        placeholder="WebDAV Password"
        required
        bind:value={storageSourcePassword}
      />
      <SettingsEncryptionPassword
        bind:password={storageSourceEncryptionPassword}
        disabled={storageSourceEncryptionDisabled}
        storedInManager={configuredStoredInManager}
        initialPassword={configuredStoredInManager ? configuredUnlockAction?.secret : undefined}
      />
    {:else}
      <input required type="text" placeholder="Client ID" bind:value={storageSourceClientId} />
      <input
        class="mt-4"
        type="text"
        placeholder="Client Secret"
        bind:value={storageSourceClientSecret}
      />
      <SettingsEncryptionPassword
        bind:password={storageSourceEncryptionPassword}
        disabled={storageSourceEncryptionDisabled}
        storedInManager={configuredStoredInManager}
        initialPassword={configuredStoredInManager ? configuredUnlockAction?.secret : undefined}
      />
    {/if}
    {#if error}
      <div class="text-red-500">Error: {error}</div>
    {/if}
  </div>
  <div class="mt-4 flex grow justify-between" slot="footer">
    <button class={buttonClasses} on:click={() => closeDialog()}>
      Cancel
      <Ripple />
    </button>
    <button class={buttonClasses} on:click={save}>
      Save
      <Ripple />
    </button>
  </div>
</DialogTemplate>

<style>
  input:disabled {
    cursor: not-allowed;
  }
</style>
