import { fetchWithUA } from "../lib/fetch";

export const getAVWikiDBTrailer = async (code: string, signal?: AbortSignal) => {
  const res = await fetchWithUA(`https://avwikidb.com/work/${encodeURIComponent(code)}/`, signal);
  if (!res.ok) throw new Error();

  let jsonText = "";

  await new HTMLRewriter()
    .on("script#__NEXT_DATA__", {
      text: ({ text }) => {
        jsonText += text;
      },
    })
    .transform(res)
    .arrayBuffer();

  if (!jsonText) throw new Error();

  const trailer = JSON.parse(jsonText)?.props?.pageProps?.movie?.sampleVideoBestUrl;
  if (!trailer) throw new Error();

  return trailer;
};

export const getJAVDatabaseTrailer = async (code: string, signal?: AbortSignal) => {
  const res = await fetchWithUA(`https://www.javdatabase.com/movies/${encodeURIComponent(code)}/`, signal);
  if (!res.ok) throw new Error();

  let trailer = "";

  await new HTMLRewriter()
    .on("video#jav-player source", {
      element: (el) => {
        if (!trailer) trailer = el.getAttribute("src") || "";
      },
    })
    .transform(res)
    .arrayBuffer();

  if (!trailer) throw new Error();

  return trailer;
};
