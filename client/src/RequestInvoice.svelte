<script>
  import "intl-tel-input/build/css/intlTelInput.css";
  import QRCode from "svelte-qrcode";
  import intlTelInput from "intl-tel-input";
  import "intl-tel-input/build/js/utils.js";
  import { onMount } from "svelte";

  let phoneInput;
  let phoneInputField;

  onMount(() => {
    phoneInput = intlTelInput(phoneInputField, {});
  });

  const state = { amount: undefined, invoice: undefined };

  function handleAmountChange(e) {
    state.amount = e.target.value;
  }

  function handleClick() {
    const number = phoneInput.getNumber();

    fetch("https://lucky-deer-63.loca.lt/requestinvoicetonumber", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": 1,
      },
      body: JSON.stringify({
        number,
        amount: state.amount,
      }),
    }).then(async (response) => {
      if (response.status === 200) {
        const res = await response.json();
        state.invoice = res.invoice;
        alert("Orden de pago creada!");
      }
    });
  }
</script>

<main>
  <h1>lnsms</h1>
  <h3>Experimental lightning network payments by SMS (1000 sats fixed fee)</h3>
  {#if !state.invoice}
    <p>
      <label for="phone">Número de Teléfono Móvil</label><br />
      <input
        type="tel"
        bind:this={phoneInputField}
        id="input_phone"
        name="phone"
      />
    </p>
    <p>
      <label for="number">Cantidad</label><br />
      <input
        type="number"
        id="input_number"
        name="number"
        on:change={handleAmountChange}
      />
    </p>

    <button on:click={handleClick}>Generar orden de pago</button>
  {:else}
    <QRCode value={state.invoice} />
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
