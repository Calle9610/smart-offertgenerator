export default function PricePreview({ subtotal, vat, total }: { subtotal:number, vat:number, total:number }) {
    return (
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="p-2 bg-white rounded border">Delsumma<br/><strong>{subtotal.toFixed(2)} SEK</strong></div>
        <div className="p-2 bg-white rounded border">Moms<br/><strong>{vat.toFixed(2)} SEK</strong></div>
        <div className="p-2 bg-white rounded border">Totalt<br/><strong>{total.toFixed(2)} SEK</strong></div>
      </div>
    )
  }
