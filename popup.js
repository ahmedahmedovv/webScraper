document.getElementById('extractContent').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // First inject Readability.js
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['Readability.js']
  });

  // Then execute the content extraction
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: function() {
      try {
        // Create a new Readability object
        const documentClone = document.cloneNode(true);
        const reader = new Readability(documentClone);
        
        // Parse the content
        const article = reader.parse();
        if (!article) {
          throw new Error('Could not parse article content');
        }
        
        // Create temporary div to get clean text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = article.content;
        
        // Get clean text content
        const cleanText = tempDiv.textContent.replace(/\s+/g, ' ').trim();
        
        // Create or get the content display container
        let container = document.getElementById('readability-content');
        if (!container) {
          container = document.createElement('div');
          container.id = 'readability-content';
          container.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 400px;
            height: 100vh;
            background: #ffffff;
            padding: 32px;
            box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
            overflow-y: auto;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: #2c3e50;
            white-space: pre-wrap;
          `;
        }

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 8px 12px;
          font-size: 20px;
          border: none;
          background: none;
          cursor: pointer;
          color: #94a3b8;
          transition: color 0.2s ease;
        `;
        closeButton.onmouseover = () => closeButton.style.color = '#475569';
        closeButton.onmouseout = () => closeButton.style.color = '#94a3b8';
        closeButton.onclick = () => container.remove();
        
        // Set the content with just title and clean text
        container.innerHTML = `
          <div style="margin-bottom: 24px; font-size: 20px; font-weight: 500; color: #1e293b;">${article.title || ''}</div>
          <div style="color: #475569;">${cleanText}</div>
        `;
        container.appendChild(closeButton);
        
        document.body.appendChild(container);
      } catch (error) {
        console.error('Error extracting content:', error);
        alert('Failed to extract content: ' + error.message);
      }
    }
  });
}); 