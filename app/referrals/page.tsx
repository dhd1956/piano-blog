import ReferralDashboard from '@/components/referral/ReferralDashboard'

export const metadata = {
  title: 'Referral Program - Global Piano Network',
  description: 'Invite musicians and earn PXP rewards through our referral program',
}

export default function ReferralsPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Referral Program</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Invite fellow musicians and earn PXP rewards when they join and engage with the community
        </p>
      </div>

      <ReferralDashboard />
    </div>
  )
}
