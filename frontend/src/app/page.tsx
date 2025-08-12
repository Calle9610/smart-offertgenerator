export default function Home() {
    return (
      <div className="space-y-4">
        <p>Välkommen! Gå till <code>/quotes/new</code> för att skapa en offert.</p>
        <a className="inline-block rounded-lg bg-black text-white px-4 py-2" href="/quotes/new">Ny offert</a>
      </div>
    )
  }
