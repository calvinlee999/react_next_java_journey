// Simplified shell app demonstration
// This demonstrates the micro-frontend architecture concept

console.log('Micro-Frontend Shell Application Starting...');

document.addEventListener('DOMContentLoaded', function() {
  const app = document.getElementById('app') || document.body;
  
  app.innerHTML = `
    <div style="min-height: 100vh; background-color: #f9fafb; font-family: system-ui, -apple-system, sans-serif;">
      <!-- Navigation -->
      <nav style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 1rem 0;">
        <div style="max-width: 1200px; margin: 0 auto; padding: 0 1rem; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #1f2937;">
            🏠 Micro-Frontend Portal
          </div>
          <div style="display: flex; gap: 1rem;">
            <button onclick="navigate('/')" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
              Home
            </button>
            <button onclick="navigate('/users')" style="padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
              User Management
            </button>
            <button onclick="showMonolithicComparison()" style="padding: 0.5rem 1rem; background: #8b5cf6; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
              View Monolithic
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;">
        <div id="content">
          <!-- Content will be loaded here -->
        </div>
      </main>
    </div>
  `;

  // Load dashboard by default
  loadDashboard();
});

function navigate(route) {
  const contentDiv = document.getElementById('content');
  
  if (route === '/') {
    loadDashboard();
  } else if (route === '/users') {
    loadUserManagement();
  }
  
  // Update URL without page reload
  window.history.pushState({}, '', route);
}

function loadDashboard() {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div style="text-align: center; margin-bottom: 3rem;">
      <h1 style="font-size: 2.5rem; font-weight: bold; color: #1f2937; margin-bottom: 1rem;">
        Micro-Frontend Portal
      </h1>
      <p style="font-size: 1.125rem; color: #6b7280; max-width: 600px; margin: 0 auto;">
        A demonstration of micro-frontend architecture where independent teams 
        develop and deploy domain-specific features autonomously.
      </p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 3rem;">
      <!-- User Management Card -->
      <div onclick="navigate('/users')" style="background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 1.5rem; cursor: pointer; transition: transform 0.2s;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.25rem; font-weight: 600; color: #1f2937;">User Management</h3>
          <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%;"></div>
        </div>
        <p style="color: #6b7280; margin-bottom: 1rem;">
          Independent micro-frontend for user management domain.
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.875rem; color: #9ca3af;">Route: /users</span>
          <button style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem;">
            Open
          </button>
        </div>
      </div>

      <!-- Analytics Card -->
      <div style="background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 1.5rem; opacity: 0.7;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.25rem; font-weight: 600; color: #1f2937;">Analytics</h3>
          <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%;"></div>
        </div>
        <p style="color: #6b7280; margin-bottom: 1rem;">
          Independent micro-frontend for analytics domain.
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.875rem; color: #9ca3af;">Route: /analytics</span>
          <button style="background: #9ca3af; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem;" disabled>
            Coming Soon
          </button>
        </div>
      </div>

      <!-- E-commerce Card -->
      <div style="background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 1.5rem; opacity: 0.7;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.25rem; font-weight: 600; color: #1f2937;">E-commerce</h3>
          <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%;"></div>
        </div>
        <p style="color: #6b7280; margin-bottom: 1rem;">
          Independent micro-frontend for e-commerce domain.
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.875rem; color: #9ca3af;">Route: /shop</span>
          <button style="background: #9ca3af; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem;" disabled>
            Coming Soon
          </button>
        </div>
      </div>
    </div>

    <!-- Architecture Benefits -->
    <div style="background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #1f2937; margin-bottom: 1.5rem;">
        Micro-Frontend Benefits
      </h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
        <div style="text-align: center; padding: 1rem;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
          <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">Team Autonomy</h3>
          <p style="font-size: 0.875rem; color: #6b7280;">Independent development and deployment cycles</p>
        </div>
        
        <div style="text-align: center; padding: 1rem;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🛠️</div>
          <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">Technology Freedom</h3>
          <p style="font-size: 0.875rem; color: #6b7280;">Different frameworks and tools per domain</p>
        </div>
        
        <div style="text-align: center; padding: 1rem;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🛡️</div>
          <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">Fault Isolation</h3>
          <p style="font-size: 0.875rem; color: #6b7280;">Failures in one area don't affect others</p>
        </div>
      </div>
    </div>
  `;
}

function loadUserManagement() {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <h1 style="font-size: 2rem; font-weight: bold; color: #1f2937; margin-bottom: 0.5rem;">
        User Management Micro-Frontend
      </h1>
      <p style="color: #6b7280;">
        This would load the actual User Management micro-frontend running on port 3001.
      </p>
    </div>

    <div style="background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 2rem; margin-bottom: 2rem;">
      <h2 style="font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem;">
        Micro-Frontend Loading Simulation
      </h2>
      
      <div id="mf-iframe-container" style="border: 2px dashed #d1d5db; border-radius: 0.5rem; padding: 2rem; text-align: center; min-height: 400px;">
        <div style="margin-bottom: 1rem;">
          <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #3b82f6; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">
          Loading User Management
        </h3>
        <p style="color: #6b7280; margin-bottom: 1rem;">
          In a real implementation, this would load the micro-frontend from http://localhost:3001
        </p>
        <button onclick="loadActualMicroFrontend()" style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer;">
          Load Actual Micro-Frontend
        </button>
      </div>
    </div>

    <div style="background: #f3f4f6; border-radius: 0.5rem; padding: 1.5rem;">
      <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 1rem;">Architecture Notes:</h3>
      <ul style="color: #6b7280; line-height: 1.6;">
        <li>• The User Management micro-frontend runs independently on port 3001</li>
        <li>• It can be developed, tested, and deployed separately</li>
        <li>• Module Federation would allow seamless integration</li>
        <li>• Error boundaries isolate failures to individual micro-frontends</li>
        <li>• Teams can use different React versions, state management, etc.</li>
      </ul>
    </div>
  `;
}

function loadActualMicroFrontend() {
  const container = document.getElementById('mf-iframe-container');
  container.innerHTML = `
    <iframe 
      src="http://localhost:3001" 
      style="width: 100%; height: 500px; border: none; border-radius: 0.5rem;"
      title="User Management Micro-Frontend"
    ></iframe>
    <p style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
      User Management micro-frontend loaded from http://localhost:3001
    </p>
  `;
}

function showMonolithicComparison() {
  window.open('http://localhost:3000', '_blank');
}

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
