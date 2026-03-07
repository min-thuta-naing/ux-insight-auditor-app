/**
 * UX Insight Auditor - Database & Storage Stress Test
 * 
 * Run this in your browser console (F12 -> Console) 
 * after running at least one audit manually.
 */

async function runSubmissionTest(count = 200) {
    console.log(`%c 🚀 Starting Stress Test: ${count} Submissions`, 'color: #6366f1; font-weight: bold; font-size: 14px;');

    let success = 0;
    let errors = 0;

    for (let i = 1; i <= count; i++) {
        const submitBtn = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.innerText.includes('Submit Assignment'));

        if (!submitBtn) {
            console.error("❌ Could not find 'Submit Assignment' button. Are you on the Auditor page?");
            break;
        }

        if (submitBtn.disabled) {
            console.warn(`⏳ Waiting for button to enable (Iteration ${i})...`);
            await new Promise(r => setTimeout(r, 2000));
            i--; // Retry this iteration
            continue;
        }

        try {
            console.log(`📡 Sending submission ${i}/${count}...`);
            submitBtn.click();
            success++;

            // Give it time to process and for the "Success" navigation to happen
            await new Promise(r => setTimeout(r, 2000));

            // If we navigated to success page, go back to keep testing
            if (window.location.pathname.includes('/success')) {
                window.history.back();
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (e) {
            console.error(`❌ Error at ${i}:`, e);
            errors++;
        }
    }

    console.log(`%c ✨ Stress Test Finished!`, 'color: #10b981; font-weight: bold;');
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`💡 Check your Firestore 'submissions' collection to verify the data reached the DB.`);
}

// To run:
// runSubmissionTest(200);
