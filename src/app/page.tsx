'use client'

import React from 'react'
import KineticGrid from './components/KineticGrid'
import Nav from './components/Nav'



export default function Page() {
  return (
    <main className="pageMain">
      {/* ── kinetic background ── */}
      <KineticGrid
        backgroundColor="transparent"
        gridColor="#333"
        dotColor="#555"
        hoverColor="#0073FF"
        gridSize={60}
        repulsionStrength={-0.65}
        radius={300}
        dotSize={1.5}
        baseOpacity={0.15}
      />

      {/* ── all content above the grid ── */}
      <div className="contentWrap">

        {/* NAV */}
        <Nav />

        {/* HERO */}
        <section className="heroWrap">

          <div className="badge">
            <span className="badgeDot" />

            Mistral AI · LangChain · MERN Stack
          </div>

          <h1 className="h1">
            AI Incident Review System
            <br />
            <span className="h1Accent">for Engineering Teams</span>
          </h1>


          <p className="heroSub">

            Small startups handle outages, bugs, and production incidents badly.
            AIRIS gives your team a structured, AI-powered workflow to capture,
            summarize, and resolve issues — fast.
          </p>

          <div className="ctaRow">
            <button className="btnPrimary" onClick={() => (window.location.href = "/register")}>
              Start free →
            </button>
            <button className="btnGhost">
              See how it works
            </button>
          </div>


          {/* tech pills */}
          <div className="pillRow">

            {['NNext.js', 'mistral-medium', 'LangChain', 'Express', 'MongoDB', 'React', 'Node'].map(t => (
              <span key={t} className="pill">{t}</span>
            ))}
          </div>

        </section>

        {/* DIVIDER */}
        <div className="divider" />

        {/* STATS */}
        <section className="statsRow">
          {[
            { num: '3×', label: 'faster resolution' },
            { num: 'AI', label: 'auto-summarisation' },
            { num: '∞', label: 'projects per lead' },
            { num: '0', label: 'missed incidents' },
          ].map(({ num, label }) => (
            <div key={label} className="stat">
              <span className="statNum">{num}</span>
              <span className="statLabel">{label}</span>
            </div>
          ))}
        </section>


        {/* ROLES */}
        <section className="section">
          <p className="sectionTag">User roles</p>
          <h2 className="sectionTitle">Two roles, clear responsibilities</h2>
          <p className="sectionSub">
            Register as a Team Lead or Employee. Leads own projects; employees
            report incidents. Everyone stays in their lane.
          </p>


          <div className="rolesGrid">
            {/* Team Lead */}
            <div className="roleCard roleCardLead">
              <span className="roleTag roleTagLead">Team Lead</span>
              <p className="roleName">Project owner</p>
              <ul className="roleList">
                {[
                  'Create and manage multiple projects',
                  'Add employees to any project',
                  'View all team members on dashboard',
                  'Close a project once resolved',
                ].map(item => (
                  <li key={item} className="roleItem">
                    <span className="roleArrow" style={{ color: '#4d7fff' }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Employee */}
            <div className="roleCard roleCardEmp">
              <span className="roleTag roleTagEmp">Employee</span>
              <p className="roleName">Incident reporter</p>
              <ul className="roleList">
                {[
                  'Join multiple projects simultaneously',
                  'Post issues with screenshots',
                  'Comment on issues within your project',
                  'View AI-generated summaries instantly',
                ].map(item => (
                  <li key={item} className="roleItem">
                    <span className="roleArrow" style={{ color: '#4dd4a0' }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* AI HIGHLIGHT */}
        <section className="section">
          <div className="aiBlock">
            <div className="aiIcon">🤖</div>
            <div style={{ flex: 1 }}>
              <p className="aiTitle">Powered by Mistral AI via LangChain</p>
              <p className="aiDesc">
                When an employee posts an issue, it is automatically sent to
                Mistral AI through a LangChain pipeline. The AI reads the
                description and returns a clean, structured summary — so every
                team member instantly understands the incident without reading
                a wall of text.
              </p>
              <div className="pillRow">
                {['mistral-medium', 'LangChain', 'auto-summarise', 'structured output'].map(t => (
                  <span key={t} className="pill">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}