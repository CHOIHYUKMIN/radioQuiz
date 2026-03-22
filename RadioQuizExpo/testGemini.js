const apiKey = 'AIzaSyALXjttz3XbST4KF_m7fJZaWntpIKWmiV4';

async function testModel(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "안녕" }] }] })
    });
    console.log(`\n--- Model: ${modelName} ---`);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (err) {
    console.error(err);
  }
}

async function run() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-2.5-flash');
  await testModel('gemini-2.0-flash-lite-preview-02-05');
  await testModel('gemini-2.0-flash');
}
run();
