document.addEventListener('DOMContentLoaded', function() {
    const videoUrlInput = document.getElementById('video-url');
    const fetchBtn = document.getElementById('fetch-btn');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    const thumbnail = document.getElementById('thumbnail');
    const videoTitle = document.getElementById('video-title');
    const errorMessage = document.getElementById('error-message');
    const downloadBtn = document.getElementById('download-btn');
    const qualityButtons = document.querySelectorAll('.quality-btn');
    const currentYearElement = document.getElementById('current-year');
    
    // Set current year in footer
    currentYearElement.textContent = new Date().getFullYear();
    
    let currentVideoId = '';
    let currentQuality = 'maxresdefault';
    
    // Extract video ID from various YouTube URL formats
    function extractVideoId(url) {
        // Regular YouTube URL
        let match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        
        // YouTube Shorts URL
        if (!match) {
            match = url.match(/(?:youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
        }
        
        return match ? match[1] : null;
    }
    
    // Set thumbnail based on quality
    function setThumbnail(videoId, quality = 'maxresdefault') {
        currentQuality = quality;
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
        thumbnail.src = thumbnailUrl;
        
        // Check if the high-quality thumbnail exists
        if (quality === 'maxresdefault') {
            const img = new Image();
            img.onload = function() {
                // If the image is the default 120x90 size, it means the HD version doesn't exist
                if (this.width === 120 && this.height === 90) {
                    // Fall back to SD quality
                    setThumbnail(videoId, 'sddefault');
                    // Update active button
                    document.querySelector('.quality-btn[data-quality="sddefault"]').click();
                }
            };
            img.src = thumbnailUrl;
        }
    }
    
    // Download the thumbnail image
    async function downloadThumbnail() {
        if (!currentVideoId) return;
        
        try {
            const thumbnailUrl = `https://img.youtube.com/vi/${currentVideoId}/${currentQuality}.jpg`;
            
            // Fetch the image
            const response = await fetch(thumbnailUrl);
            const blob = await response.blob();
            
            // Create a temporary URL for the blob
            const blobUrl = URL.createObjectURL(blob);
            
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `youtube-thumbnail-${currentVideoId}-${currentQuality}.jpg`;
            
            // Append to the document, click it, and remove it
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Release the blob URL
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            errorMessage.textContent = 'Error downloading the thumbnail. Please try again.';
            console.error('Download error:', error);
        }
    }
    
    // Handle fetch button click
    fetchBtn.addEventListener('click', function() {
        const url = videoUrlInput.value.trim();
        errorMessage.textContent = '';
        
        if (!url) {
            errorMessage.textContent = 'Please enter a YouTube URL';
            return;
        }
        
        const videoId = extractVideoId(url);
        
        if (!videoId) {
            errorMessage.textContent = 'Invalid YouTube URL. Please check the URL and try again.';
            return;
        }
        
        currentVideoId = videoId;
        
        // Set the active quality button to HD by default
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.quality === 'maxresdefault') {
                btn.classList.add('active');
            }
        });
        
        // Set the thumbnail
        setThumbnail(videoId);
        
        // Show the thumbnail container
        thumbnailContainer.style.display = 'flex';
        
        // Set video title (in a real app, you might want to fetch this from the YouTube API)
        videoTitle.textContent = 'YouTube Video Thumbnail';
    });
    
    // Handle download button click
    downloadBtn.addEventListener('click', downloadThumbnail);
    
    // Handle quality button clicks
    qualityButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!currentVideoId) return;
            
            // Remove active class from all buttons
            qualityButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set thumbnail with selected quality
            setThumbnail(currentVideoId, this.dataset.quality);
        });
    });
    
    // Handle Enter key press in the input field
    videoUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchBtn.click();
        }
    });
    
    // Handle thumbnail load error
    thumbnail.addEventListener('error', function() {
        if (thumbnail.src.includes('maxresdefault')) {
            // If HD fails, try SD
            setThumbnail(currentVideoId, 'sddefault');
            document.querySelector('.quality-btn[data-quality="sddefault"]').click();
        } else if (thumbnail.src.includes('sddefault')) {
            // If SD fails, try medium quality
            setThumbnail(currentVideoId, 'mqdefault');
            document.querySelector('.quality-btn[data-quality="mqdefault"]').click();
        } else if (thumbnail.src.includes('mqdefault')) {
            // If medium fails, try low quality
            setThumbnail(currentVideoId, 'default');
            document.querySelector('.quality-btn[data-quality="default"]').click();
        } else {
            // If all fail, show error
            errorMessage.textContent = 'Could not load thumbnail for this video.';
        }
    });
});