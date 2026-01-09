<script lang="ts">
  import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

  export let password = '';
  export let initialPassword: string | undefined;
  export let disabled = false;
  export let storedInManager = false;

  const passwordManagerAvailable = 'PasswordCredential' in window;

  let confirmPassword = '';
  let pwElm: HTMLInputElement;
  let confirmElm: HTMLInputElement;
  let availableInManager = (passwordManagerAvailable && storedInManager) || false;
  function validateMatch(password: string, confirmPassword: string) {
    if (!confirmPassword) {
      return;
    }

    confirmElm.setCustomValidity(password === confirmPassword ? '' : 'Password does not match');
  }

  function setInitialPassword(element: HTMLInputElement) {
    if (element && initialPassword) {
      element.value = initialPassword;
    }
  }

  $: setInitialPassword(pwElm);
  $: setInitialPassword(confirmElm);
  $: validateMatch(password, confirmPassword);
</script>

<input
  class="mt-4"
  type="password"
  placeholder="Encryption Password"
  required={!disabled}
  {disabled}
  bind:value={password}
  bind:this={pwElm}
/>
<input
  class="mt-4"
  type="password"
  placeholder="Confirm Encryption Password"
  required={!disabled}
  {disabled}
  bind:value={confirmPassword}
  bind:this={confirmElm}
/>
{#if passwordManagerAvailable}
  <div class="mt-4">
    <input
      id="cbx-store-in-manager"
      type="checkbox"
      bind:checked={availableInManager}
      on:change={() => {
        if (availableInManager && disabled) {
          disabled = false;
        }
      }}
    />
    <label for="cbx-store-in-manager" class="ml-2 mr-6">Store in Password Manager</label>
  </div>
{/if}
<div class="mt-4">
  <input
    id="cbx-disable-encryption"
    type="checkbox"
    bind:checked={disabled}
    on:change={() => {
      if (disabled) {
        availableInManager = false;
        pwElm.value = '';
        confirmElm.value = '';
      }
    }}
  />
  <label for="cbx-disable-encryption" class="ml-2 mr-6">Disable Password Encryption</label>
</div>

{#if storedInManager || disabled}
  <div class="flex items-center my-4 max-w-xs">
    <Fa icon={faTriangleExclamation} />
    <span class="ml-2">
      Make sure to understand the
      <a
        class="text-red-500"
        href="https://github.com/ttu-ttu/ebook-reader?tab=readme-ov-file#security-considerations"
        target="_blank"
      >
        Implications
      </a>
      of your choosen Settings
    </span>
  </div>
{/if}
