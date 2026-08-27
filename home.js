// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://qneicfttboxzorcvhzmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZWljZnR0Ym94em9yY3Zoem1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODk1OTcsImV4cCI6MjA4NTc2NTU5N30.fhiCdQQ65GXjyIG_HrmQyUmxzpuaROlT-AAr_lf4nnE';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// পেজ লোড হওয়ার পর ইউজারের তথ্য, ছবি ও পোস্ট লোড করা
window.addEventListener('DOMContentLoaded', async () => {
    const userPhone = localStorage.getItem('userPhone');
    const userName = localStorage.getItem('userName');

    // সিকিউরিটি চেক: লগইন ছাড়া কেউ ঢুকতে পারবে না
    if (!userPhone || !userName) {
        alert('দয়া করে প্রথমে লগইন করুন!');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('displayUserName').innerText = userName;
    document.getElementById('userName').value = userName;
    document.getElementById('displayUserPhone').innerText = userPhone;
    
    // ডাটাবেজ থেকে ইউজারের ছবি ফেচ করা
    try {
        const { data } = await _supabase
            .from('members')
            .select('selfie_image')
            .eq('mobile', userPhone)
            .single();
            
        if (data && data.selfie_image) {
            document.getElementById('userAvatar').src = data.selfie_image;
        }
    } catch (err) {
        console.error('Image load error:', err);
    }

    // পোস্ট ও কমেন্টগুলো লোড করা
    loadPosts();
});

// ডাটাবেজ থেকে অ্যাডমিন পোস্ট ও কমেন্ট ফেচ করার ফাংশন
async function loadPosts() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '<p style="color:var(--tg-text-muted); text-align:center;">পোস্ট লোড হচ্ছে...</p>';

    try {
        const { data: posts, error } = await _supabase
            .from('admin_posts')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="tg-post-card">
                    <div class="post-meta">
                        <span class="admin-badge"><i class="fa-solid fa-shield-check"></i> এডমিন পোস্ট</span>
                        <span class="post-time">আজ</span>
                    </div>
                    <div class="post-content">
                        <h4>🚀 ইউনিটি বন্ধু গ্রুপের অফিশিয়াল যাত্রা</h4>
                        <p>প্রিয় মেম্বারগণ, আমাদের এই প্ল্যাটফর্মে আপনাদের সবাইকে স্বাগতম। নিচে আপনার মতামত বা কমেন্ট যোগ করে আমাদের সাথে যুক্ত থাকুন।</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        for (let post of posts) {
            // প্রতিটি পোস্টের কমেন্টগুলো ফেচ করা
            const { data: comments } = await _supabase
                .from('post_comments')
                .select('*')
                .eq('post_id', post.id)
                .order('id', { ascending: true });

            let commentsHtml = '';
            if (comments && comments.length > 0) {
                comments.forEach(c => {
                    commentsHtml += `
                        <div class="comment-item">
                            <div class="comment-author">${c.user_name}</div>
                            <div class="comment-text">${c.comment_text}</div>
                        </div>
                    `;
                });
            } else {
                commentsHtml = '<p style="font-size:0.8rem; color:var(--tg-text-muted);">এখনো কোনো মতামত নেই। প্রথম মতামতটি আপনি দিন!</p>';
            }

            const postCard = document.createElement('div');
            postCard.className = 'tg-post-card';
            postCard.innerHTML = `
                <div class="post-meta">
                    <span class="admin-badge"><i class="fa-solid fa-shield-check"></i> এডমিন পোস্ট</span>
                    <span class="post-time">${post.created_at ? new Date(post.created_at).toLocaleDateString() : 'আজ'}</span>
                </div>
                <div class="post-content" id="postText-${post.id}">
                    <h4>${post.title}</h4>
                    <p>${post.description}</p>
                </div>

                <!-- অ্যাডমিন পোস্টের ছবি (image_url) দেখানোর জন্য -->
                ${post.image_url ? `
                <div class="post-image-container" style="margin-bottom: 15px; border-radius: 12px; overflow: hidden; border: 1px solid var(--tg-border);">
                    <img src="${post.image_url}" alt="Post Image" style="width: 100%; max-height: 350px; object-fit: cover; display: block;">
                </div>` : ''}

                <!-- ডাউনলোড, কাজের লিংক এবং টেক্সট কপি করার বাটন সেকশন -->
                <div class="post-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    ${post.image_url ? `
                    <button onclick="downloadFile('${post.image_url}')" class="tg-btn tg-btn-blue">
                        <i class="fa-solid fa-download"></i> ছবি ডাউনলোড করুন
                    </button>` : ''}

                    ${post.file_link ? `
                    <a href="${post.file_link}" target="_blank" class="tg-btn tg-btn-purple">
                        <i class="fa-solid fa-link"></i> কাজের লিংকে যান
                    </a>` : ''}
                    
                    <button onclick="copyPostText(${post.id})" class="tg-btn" style="background: #3b82f6; color: white;">
                        <i class="fa-solid fa-copy"></i> লেখা কপি করুন (Copy)
                    </button>
                </div>

                <!-- কমেন্ট বা মতামত সেকশন -->
                <div class="comments-section">
                    <div class="feed-title" style="font-size:0.85rem;"><i class="fa-solid fa-comments"></i> মেম্বারদের মতামত (${comments ? comments.length : 0})</div>
                    <div class="comments-list" id="commentList-${post.id}">
                        ${commentsHtml}
                    </div>
                    <form class="comment-form" onsubmit="submitComment(event, ${post.id})">
                        <input type="text" id="commentInput-${post.id}" placeholder="আপনার মতামত এখানে লিখুন..." required>
                        <button type="submit">পোস্ট</button>
                    </form>
                </div>
            `;
            container.appendChild(postCard);
        }

    } catch (err) {
        console.error('Load posts error:', err);
        container.innerHTML = '<p style="color:#e74c3c; text-align:center;">পোস্ট লোড করতে সমস্যা হয়েছে।</p>';
    }
}

// সরাসরি ইমেজ বা ফাইল ডাউনলোড করার ফাংশন
async function downloadFile(fileUrl) {
    try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        
        const fileName = fileUrl.split('/').pop().split('?')[0] || 'downloaded-image.jpg';
        a.download = fileName;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
        console.error('Download failed:', err);
        window.open(fileUrl, '_blank');
    }
}

// পোস্টের টাইটেল ও বিবরণ কপি করার ফাংশন (ফেসবুকে পোস্ট করার জন্য)
function copyPostText(postId) {
    const postElement = document.getElementById(`postText-${postId}`);
    const title = postElement.querySelector('h4').innerText;
    const description = postElement.querySelector('p').innerText;
    
    const fullText = `${title}\n\n${description}`;
    
    navigator.clipboard.writeText(fullText).then(() => {
        alert('সফল! পোস্টের লেখা কপি করা হয়েছে। এখন ফেসবুকে পেস্ট করতে পারেন।');
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('লেখা কপি করতে সমস্যা হয়েছে।');
    });
}

// মেম্বারদের কমেন্ট বা মতামত সাবমিট করার ফাংশন
async function submitComment(e, postId) {
    e.preventDefault();
    const inputField = document.getElementById(`commentInput-${postId}`);
    const commentText = inputField.value.trim();
    const userName = localStorage.getItem('userName');

    if (!commentText) return;

    try {
        const { error } = await _supabase
            .from('post_comments')
            .insert([
                { post_id: postId, user_name: userName, comment_text: commentText }
            ]);

        if (error) throw error;

        inputField.value = '';
        loadPosts(); 
    } catch (err) {
        console.error('Comment error:', err);
        alert('মতামত জমা দিতে সমস্যা হয়েছে: ' + err.message);
    }
}

// জরুরি সাহায্য পপআপ ওপেন ও ক্লোজ
function openEmergencyModal() {
    document.getElementById('emergencyModal').style.display = 'flex';
}
function closeEmergencyModal() {
    document.getElementById('emergencyModal').style.display = 'none';
}

// জরুরি সাহায্যের আবেদন সাবমিট করা
async function submitEmergency() {
    const details = document.getElementById('emergencyDetails').value.trim();
    const userName = localStorage.getItem('userName');
    const userPhone = localStorage.getItem('userPhone');

    if (!details) {
        alert('দয়া করে আপনার সমস্যার বিবরণ লিখুন।');
        return;
    }

    try {
        const { error } = await _supabase
            .from('emergency_requests')
            .insert([
                { user_name: userName, mobile: userPhone, details: details }
            ]);

        if (error) throw error;

        alert('আপনার জরুরি সাহায্যের আবেদন সফলভাবে জমা হয়েছে। আমাদের টিম খুব শীঘ্রই আপনার সাথে যোগাযোগ করবে।');
        document.getElementById('emergencyDetails').value = '';
        closeEmergencyModal();
    } catch (err) {
        console.error('Emergency error:', err);
        alert('আবেদন জমা দিতে সমস্যা হয়েছে: ' + err.message);
    }
}

// লগআউট
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// কাজের লাইভ লিংক ডাটাবেজে সাবমিট করা
document.getElementById('taskSubmitForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitTaskBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'জমা হচ্ছে...';
    submitBtn.disabled = true;

    const userName = document.getElementById('userName').value;
    const taskLink = document.getElementById('taskLiveLink').value.trim();

    try {
        const { error } = await _supabase
            .from('submitted_tasks')
            .insert([
                { user_name: userName, task_link: taskLink }
            ]);

        if (error) throw error;

        alert('অভিনন্দন! আপনার কাজের লাইভ লিংক সফলভাবে জমা হয়েছে।');
        document.getElementById('taskLiveLink').value = '';

    } catch (err) {
        console.error('Error:', err);
        alert('লিংক জমা দিতে সমস্যা হয়েছে: ' + err.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});