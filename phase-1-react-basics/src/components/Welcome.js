import React from 'react';

const Welcome = () => {
  const features = [
    {
      title: "JSX & Components",
      description: "Learn how to create reusable UI components using JSX syntax and understand the component lifecycle."
    },
    {
      title: "State & Events",
      description: "Master React hooks like useState and useEffect to manage component state and handle user interactions."
    },
    {
      title: "Routing & Navigation",
      description: "Build single-page applications with React Router for seamless navigation between different views."
    }
  ];

  return (
    <div className="container">
      <section className="welcome-section">
        <div className="phase-badge">Phase 1</div>
        <h1>Welcome to React Basics!</h1>
        <p>Build solid foundations in modern React development</p>
      </section>

      <section>
        <h2>What You'll Learn</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Start Learning?</h2>
        <p>Follow the exercises in the README.md file to begin your React journey!</p>
        <button 
          className="cta-button"
          onClick={() => window.open('https://react.dev/learn', '_blank')}
        >
          Open React Docs
        </button>
      </section>
    </div>
  );
};

export default Welcome;