import { IRequest } from 'itty-router'
import uploadSong from './upload'
import getStorageSong from '../../../utils/get-storage-song'

export default async (request: IRequest, env: Env): Promise<Response> => {
  const songInfo = await request.json()

  // check if exist
  const queriedSongInfo = await getStorageSong(songInfo.id, env)
  if (queriedSongInfo !== null) {
    return new Response(JSON.stringify(queriedSongInfo), {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    })
  }

  await uploadSong(songInfo.id, `${songInfo.artist}_${songInfo.name}.mp3`, env)
  const id = await insertData(songInfo, env)
  
  const result: StorageSong = {
    id: id,
    name: songInfo.name,
    artist: songInfo.artist,
    duration: songInfo.duration,
    lyric: songInfo.lyric,
    url: generateUrl(songInfo.name, songInfo.artist),
    origin_id: songInfo.origin_id,
    source: 'storage',
    like: null
  }

  return Response.json(result)
}

const insertData = async (songInfo: NeteaseSong, env: Env) => {
  const result: D1Result = await env.DB.prepare(
    `
      INSERT INTO songs (name, artist, url, source, duration, lyric, origin_id)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    `
  )
  .bind(
    songInfo.name,
    songInfo.artist,
    generateUrl(songInfo.name, songInfo.artist),
    songInfo.source,
    songInfo.duration,
    songInfo.lyric,
    songInfo.id
  )
  .run()

  return result.meta.last_row_id;
}

const generateUrl = (name: string, artist: string) => {
  return `https://music.twan.life/song/get?key=${artist}_${name}.mp3`;
}
