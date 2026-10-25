try {
  await import('./sync-rss.mjs');
} catch (error) {
  const detail=String(error?.stack||error?.message||error).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');
  console.error('::error title=Shiderlip RSS refresh failed::'+detail);
  process.exitCode=1;
}
