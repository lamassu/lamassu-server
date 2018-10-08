module ClientServerWebsocket exposing (..)

-- Elm might not be the best platform for this kind of thing
-- Hard to do a global lookup table
-- Might be easiest to just use HTTP for this for now
-- No need to prematurely optimize and go against the flow

import WebSocket


type Msg
    = OK
    | Timeout


type alias Client =
    Sub Msg


init : String -> Client
init url =
    let
        sub =
            WebSocket.listen url parsePacket
    in
        sub


request : Client -> String -> String -> Cmd Msg
request client url payload =
    let
        cmd =
            Cmd.map (respond client) (WebSocket.send url payload)
    in
        cmd


parsePacket : String -> Msg
parsePacket packet =
    OK


respond : client -> (a -> Msg)
respond client =
    (\_ -> OK)
