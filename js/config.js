/* ==========================================================================
   KONFIGURACE FORMULÁŘE: jediné místo, kam se doplňují klíče a e-mail.
   Web běží staticky bez serveru, odeslání obstará externí služba.

   1) Web3Forms (doporučeno, zdarma): na web3forms.com zadejte e-mail klienta,
      přijde vám Access Key. Vložte ho níže do web3formsKey.
   2) Alternativa Formspree: vytvořte formulář na formspree.io a vložte
      jeho URL (https://formspree.io/f/xxxxxxx) do formspreeEndpoint.
   3) Dokud není vyplněno nic, formulář se nerozbije: otevře e-mail
      (mailto) s předvyplněnou poptávkou a nabídne telefon.
   ========================================================================== */
window.MM_CONFIG = {
  web3formsKey: "",          // <- sem vložit Access Key z Web3Forms
  formspreeEndpoint: "",     // <- nebo URL z Formspree
  fallbackEmail: "info@mminstalace.cz", // OVĚŘIT u klienta: adresa není na původním webu, jde o placeholder
  phoneDisplay: "+420 724 363 619",
  phoneHref: "tel:+420724363619",
  subject: "Nová poptávka z webu mminstalace.cz"
};
