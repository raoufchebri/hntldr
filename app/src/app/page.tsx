import PodcastList from '@/components/PodcastList';
import LatestEpisodePlayer from '@/components/LatestEpisodePlayer';
import SubscribeForm from '@/components/SubscribeForm';
import Tabs from '@/components/Tabs';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-pixel-bold text-primary mb-2 animate-pixel-pulse">HNTLDR</h1>
        <p className="text-xl font-pixel text-muted">
          Hacker News Too Long; Didn&apos;t Read - Unofficial Audio Summaries
        </p>
      </header>
      
      <div className="max-w-4xl mx-auto mb-8">
        <h2 className="text-2xl font-pixel-bold text-primary mb-4 border-b-3 border-dashed border-primary pb-2">
          Latest Episode
        </h2>
        <LatestEpisodePlayer />
        
        <div className="mt-6">
          <SubscribeForm />
        </div>
      </div>
      
      <div className="flex justify-center mb-8 space-x-4">
        <Link href="/latest">
          <div className="pixel-button bg-orange-500 text-white">
            LATEST EPISODE
          </div>
        </Link>
        <Link href="/">
          <div className="pixel-button bg-muted text-primary">
            ALL EPISODES
          </div>
        </Link>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-pixel-bold text-primary mb-6 border-b-3 border-dashed border-primary pb-2">
          All Episodes
        </h2>
        <Tabs
          tabs={[
            {
              label: "ALL",
              content: <PodcastList filter="all" />
            },
            {
              label: "WEEKLY",
              content: <PodcastList filter="weekly" />
            },
            {
              label: "DAILY",
              content: <PodcastList filter="daily" />
            }
          ]}
        />
      </div>
    </div>
  );
}
