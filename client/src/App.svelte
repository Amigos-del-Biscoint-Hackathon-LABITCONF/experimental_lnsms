<script>
  import Router from "svelte-spa-router";
  import RequestInvoice from "./RequestInvoice.svelte";
  import Claim from "./Claim.svelte";

  const routes = {
    "/": RequestInvoice,

    "/claim/:code": Claim,
  };
</script>

<body>
  <Router {routes} />
</body>
