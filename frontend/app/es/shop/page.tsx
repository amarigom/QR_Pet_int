import Link from 'next/link'

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-20 text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Tienda
        </p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Descubre nuestra colección</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Explora productos y accesorios pensados para mascotas y para quienes las cuidan.
        </p>
        <Link
          href="/"
          className="inline-flex w-fit items-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
