import HeroSection from '@/components/home/HeroSection';
import SearchBooking from '@/components/home/SearchBooking';
import FeaturesSection from '@/components/home/FeaturesSection';
import PopularRoutes from '@/components/home/PopularRoutes';
import StatsSection from '@/components/home/StatsSection';

export const metadata = {
    title: 'Serendib Go | Sri Lanka\'s #1 Online Bus Ticketing Platform',
    description: 'Book bus tickets across Sri Lanka instantly. 185+ routes, AC luxury coaches, live tracking, secure payments. Colombo to Kandy, Galle, Jaffna and more.',
    keywords: 'bus booking, Sri Lanka, online tickets, Colombo, Kandy, Galle, Jaffna, Serendib Go, travel',
};

export default function Home() {
    return (
        <main style={{ background: '#0c1226' }}>
            <HeroSection />
            <SearchBooking />
            <FeaturesSection />
            <PopularRoutes />
            <StatsSection />
        </main>
    );
}