import React from 'react'
import { ProfileHeader } from './_components/profile-header'
import { ProfileInfo } from './_components/profile-info'
import { AchievementCards } from './_components/achievement-cards'

export default function ProfilePage() {
  return (
    <div className='relative'>
      <div className="container mx-auto px-6 md:px-10 pt-6">
        <ProfileHeader />

        <div className="my-8">
          {/* Columna principal - Información del perfil */}
          <div className="space-y-8">
            <ProfileInfo />
            <AchievementCards />
          </div>
        </div>
      </div>
    </div>
  )
}
