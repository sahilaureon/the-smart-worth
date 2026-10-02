async function testRemoteApis() {
  const urls = [
    'https://api.thesmartworth.site/api/packages',
    'https://api.thesmartworth.site/api/courses'
  ];

  for (const url of urls) {
    try {
      console.log(`\nFetching: ${url}`);
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      const json = await res.json() as any;
      console.log('Response Keys:', Object.keys(json));
      console.log('Response Content:', JSON.stringify(json, null, 2).substring(0, 500));
    } catch (err: any) {
      console.error(`Error fetching ${url}:`, err.message);
    }
  }
}

testRemoteApis();
