module ClientServerWebsocket exposing (..)

import RemoteData exposing (..)
import HttpBuilder exposing (..)


-- Fetch stuff: different configurations for starters


type alias NewsResponse =
    ()


type alias Msg =
    NewsResponse (WebData News)


getNews : Cmd Msg
getNews =
    Http.get decodeNews "/news"
        |> RemoteData.asCmd
        |> Cmd.map NewsResponse
