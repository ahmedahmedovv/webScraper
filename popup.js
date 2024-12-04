// Auto-start when popup opens
document.addEventListener('DOMContentLoaded', async () => {
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
        
        // Remove all images
        const images = tempDiv.getElementsByTagName('img');
        while(images.length > 0) {
          images[0].parentNode.removeChild(images[0]);
        }
        
        // Format the content with only paragraph preservation
        const formattedContent = tempDiv.innerHTML
          .replace(/<p>/gi, '\n\n') // Double newline for paragraphs
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]*>/g, '') // Remove all HTML tags
          .replace(/&nbsp;/g, ' ')
          .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove extra blank lines
          .replace(/^\s+|\s+$/g, '') // Trim start and end
          .trim();
        
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
        closeButton.textContent = '\u00D7';
        closeButton.style.cssText = `
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 8px;
          font-size: 16px;
          border: none;
          background: none;
          cursor: pointer;
          color: #666;
        `;
        closeButton.onclick = () => container.remove();
        
        // Update the content container HTML structure
        container.innerHTML = `
          <div style="
            color: #2c3e50;
            padding: 20px;
            border: 1px solid transparent;
            border-radius: 4px;
            min-height: 200px;
            white-space: pre-wrap;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.2;
          " contenteditable="true" spellcheck="true">${article.title ? `${article.title}\n\n` : ''}${formattedContent || 'No content available'}</div>
        `;
        container.appendChild(closeButton);
        
        document.body.appendChild(container);
      } catch (error) {
        console.error('Error extracting content:', error);
        alert('Failed to extract content: ' + error.message);
      }
    }
  });

  // Close the popup after initiating the content extraction
  window.close();
}); 