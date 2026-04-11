export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-3xl text-center">
        <p className="mb-6 text-sm uppercase tracking-[0.2em] text-coal/60">
          Elegant Render Platform
        </p>
        <h1 className="text-5xl font-medium leading-tight text-coal sm:text-6xl md:text-7xl">
          Lep prikaz.
          <br />
          Jasna cena.
          <br />
          Lakša odluka.
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-coal/75">
          Ručno izrađeni renderi, virtuelno opremanje i vizuelne adaptacije
          prostora za domove, stanove i nekretnine koje želite da prikažete
          bolje.
        </p>
        <p className="mt-16 text-xs uppercase tracking-[0.18em] text-coal/50">
          Elegant Render je deo White Rook DOO
        </p>
      </div>
    </main>
  );
}
