"""Build daily-hour.html (the Claude-hosted copy) from index.html.
The artifact host adds its own <html>/<head>/<body>, so we keep only the
marked head bits and body content."""
import re, pathlib
src = pathlib.Path(__file__).with_name("index.html").read_text(encoding="utf-8")
head = re.search(r"<!-- artifact:head -->(.*?)<!-- /artifact:head -->", src, re.S).group(1)
body = re.search(r"<!-- artifact:body -->(.*?)<!-- /artifact:body -->", src, re.S).group(1)
pathlib.Path(__file__).with_name("daily-hour.html").write_text(head.strip() + "\n" + body.strip() + "\n", encoding="utf-8")
print("wrote daily-hour.html")
