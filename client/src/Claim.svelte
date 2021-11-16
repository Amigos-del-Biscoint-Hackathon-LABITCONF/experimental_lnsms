<script>
  import "intl-tel-input/build/js/utils.js";

  export let params = {};

  const { code } = params;

  const state = { invoice: undefined };

  function handleInvoiceChange(e) {
    state.invoice = e.target.value;
  }

  function handleClick() {
    fetch("https://lucky-deer-63.loca.lt/claim", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": 1,
      },
      body: JSON.stringify({
        code,
        invoice: state.invoice,
      }),
    }).then(async (response) => {
      if (response.status === 200) {
        console.log(await response.json());
        alert("Pago enviado!");
      }
    });
  }
</script>

<main>
  <h1>lnsms</h1>
  <h3>Experimental lightning network by SMS</h3>
  <p>
    <label for="string">Insira tu invoice (orden de pago) lightning</label><br
    />
    <input
      type="string"
      id="input_string"
      name="string"
      on:change={handleInvoiceChange}
    />
  </p>

  <button on:click={handleClick}>Resgatar mis Bitcoins</button>
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
