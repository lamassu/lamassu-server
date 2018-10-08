module StatusDecoder exposing (..)

import StatusTypes exposing (..)
import Json.Decode exposing (..)


rateDecoder : Decoder Rate
rateDecoder =
    map3 Rate
        (field "crypto" string)
        (field "bid" float)
        (field "ask" float)


serverDecoder : Decoder ServerRec
serverDecoder =
    map5 ServerRec
        (field "up" bool)
        (field "lastPing" (nullable string))
        (field "rates" (list rateDecoder))
        (field "machineStatus" string)
        (field "wasConfigured" bool)


statusDecoder : Decoder StatusRec
statusDecoder =
    map2 StatusRec
        (field "server" serverDecoder)
        (field "invalidConfigGroups" (list string))
