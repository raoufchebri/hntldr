import UnsubscribeForm from '@/components/UnsubscribeForm';

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function UnsubscribePage({
  searchParams,
}: PageProps) {
  const id = (await searchParams).id;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-pixel-bold text-primary mb-2">Unsubscribe</h1>
        <p className="text-xl font-pixel text-muted">
          We&apos;re sorry to see you go
        </p>
      </header>
      
      <div className="max-w-lg mx-auto">
        <UnsubscribeForm subscriberId={id} />
      </div>
    </div>
  );
}