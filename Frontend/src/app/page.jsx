import HeroSection from '@/components/home/HeroSection';

export const metadata = {
    title:  'Bus Online | Sri Lanka\'s No.1 Online Bus Ticketing Platform',
    description: 'Welcome to our home page',
    keywords: 'bus, online, home, travel, booking',

};

export default function Home() {
    return (
        <main className="bg-white">
    <HeroSection />
        </main>
    );
}   