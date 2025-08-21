// Svenska UI-texter för Smart Offertgenerator
export const sv = {
  common: {
    loading: 'Laddar...',
    error: 'Ett fel uppstod',
    success: 'Lyckades',
    customer: 'Kund',
    project: 'Projekt',
    customerAndProject: 'Kund & Projekt',
    customerAndProjectDesc: 'Grundinformation om kund och projekt',
    customerName: 'Kundnamn',
    projectName: 'Projektnamn',
    roomType: 'Rumstyp',
    finishLevel: 'Utförandenivå',
    detailsAndTerms: 'Detaljer & Villkor',
    detailsAndTermsDesc: 'Antaganden, exkluderingar och tidslinje',
    quoteRows: 'Offertrader',
    quoteRowsDesc: 'Arbetsmoment, material och övrigt',
    quoteSummary: 'Offertsammanfattning',
    rows: 'rader',
    lastUpdated: 'Senast uppdaterad',
    autoTuning: 'Auto-tuning',
    learnedPatterns: 'Lärda mönster',
    quote: {
      title: 'Offert',
      items: 'Rader',
      summary: 'Sammanfattning',
      assumptions: 'Antaganden',
      exclusions: 'Exkluderingar',
      timeline: 'Tidslinje',
      subtotal: 'Delsumma',
      vat: 'Moms',
      total: 'Totalt'
    },
    questions: 'Har du frågor?',
    helpText: 'Vi hjälper dig gärna att välja rätt paket',
    choosePackage: 'Välj ditt paket',
    packageDescription: 'Vi har förberett tre olika paket för dig. Välj det som passar dina behov och budget bäst.',
    whatIncluded: 'Vad ingår i paketet?',
    customizeQuote: 'Anpassa din offert',
    customizeDescription: 'Lägg till eller ta bort tillval för att skräddarsy offerten efter dina behov',
    updatingTotals: 'Uppdaterar totals...'
  },
  actions: {
    save: 'Spara',
    cancel: 'Avbryt',
    delete: 'Radera',
    send: 'Skicka',
    downloadPdf: 'Ladda ner PDF',
    accept: 'Acceptera',
    decline: 'Avböj',
    regenerate: 'Generera om',
    addRow: 'Lägg till rad',
    remove: 'Ta bort',
    edit: 'Redigera',
    search: 'Sök',
    filter: 'Filtrera',
    back: 'Tillbaka',
    next: 'Nästa',
    close: 'Stäng',
    create: 'Skapa',
    createQuote: 'Skapa offert',
    calculate: 'Beräkna',
    sendQuote: 'Skicka offert',
    downloading: 'Laddar ner...',
    undo: 'Ångra',
    redo: 'Gör om'
  },
  states: {
    loading: { title: 'Laddar...', desc: 'Hämtar data från servern' },
    empty: { title: 'Inget innehåll', desc: 'Det finns inget att visa just nu' },
    noResults: { title: 'Inga resultat', desc: 'Inga matchningar hittades för din sökning' },
    error: { title: 'Ett fel uppstod', desc: 'Kunde inte ladda innehållet' },
    retry: { title: 'Försök igen', desc: 'Klicka för att ladda om' },
    success: { title: 'Lyckades!', desc: 'Åtgärden slutfördes' },
    draft: { title: 'Utkast', desc: 'Sparat men inte skickat' },
    sent: { title: 'Skickad', desc: 'Skickad till kunden' },
    accepted: { title: 'Accepterad', desc: 'Kunden har accepterat' },
    declined: { title: 'Avböjt', desc: 'Kunden har avböjt' },
    inProgress: { title: 'Pågående', desc: 'Arbetet pågår' },
    completed: { title: 'Slutförd', desc: 'Allt är klart' }
  },
  errors: {
    network: 'Nätverksfel',
    server: 'Serverfel',
    auth: 'Åtkomst nekad',
    timeout: 'Tidsgräns överskriden',
    unknown: 'Ett oväntat fel uppstod',
    notFound: 'Kunde inte hitta det du letade efter',
    forbidden: 'Du har inte behörighet att utföra denna åtgärd',
    unauthorized: 'Du måste logga in för att fortsätta',
    validation: 'Kontrollera att all information är korrekt',
    saveFailed: 'Kunde inte spara ändringarna',
    sendFailed: 'Kunde inte skicka meddelandet',
    requestCancelled: 'Förfrågan avbröts',
    showErrorDetails: 'Visa felinformation'
  }
} as const

// Typ som matchar strukturen
export type Copy = typeof sv

// Type guard för att kontrollera om ett objekt är av typen Copy
export function isCopy(obj: unknown): obj is Copy {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'common' in obj &&
    'actions' in obj &&
    'states' in obj &&
    'errors' in obj
  )
}

export default sv
