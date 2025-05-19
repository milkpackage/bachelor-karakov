import Header from "@/components/header"
import Dashboard from "@/components/dashboard"
import EmotionTracker from "@/components/emotion-tracker"
import TestsSection from "@/components/tests-section"
import ChatbotSection from "@/components/chatbot-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0c0c10]">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-12">
        <Dashboard />
        <EmotionTracker />
        <TestsSection />
        <ChatbotSection />
      </div>
    </main>
  )
}
