// Function to copy daily task text
function copyTaskText() {
    const textElement = document.getElementById("dailyTaskText").innerText;
    navigator.clipboard.writeText(textElement).then(() => {
        alert("পোস্টের টেক্সট সফলভাবে কপি হয়েছে! এখন আপনার ফেসবুকে পেস্ট করুন।");
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
}

// Function to handle link submission
function handleSubmission(event) {
    event.preventDefault(); // Prevent page reload

    const memberId = document.getElementById("memberId").value.trim();
    const fbLink = document.getElementById("fbLink").value.trim();
    const successMsg = document.getElementById("successMsg");

    // Simple validation for facebook link
    if(!fbLink.includes("facebook.com") && !fbLink.includes("fb.com")) {
        alert("দয়া করে একটি সঠিক ফেসবুক পোস্টের লিংক দিন!");
        return;
    }

    // Success response simulation (Later this will connect to Database/Backend)
    successMsg.innerText = `ধন্যবাদ! আইডি (${memberId}) এর জন্য লিংকটি সফলভাবে জমা হয়েছে। ব্যাকগ্রাউন্ড ট্র্যাক আপডেট করা হয়েছে।`;
    
    // Clear form inputs
    document.getElementById("submitForm").reset();

    // Clear success message after 5 seconds
    setTimeout(() => {
        successMsg.innerText = "";
    }, 5000);
}