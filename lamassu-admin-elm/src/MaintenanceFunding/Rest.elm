module MaintenanceFunding.Rest exposing (..)

import RemoteData exposing (..)
import HttpBuilder exposing (..)
import Json.Decode as D
import Json.Decode.Pipeline exposing (decode, required)
import Http
import HttpBuilder exposing (..)
import MaintenanceFunding.Types exposing (..)


getForm : Maybe String -> Cmd Msg
getForm maybeCrypto =
    get ("/api/funding/" ++ (Maybe.withDefault "" maybeCrypto))
        |> withExpect (Http.expectJson subModelDecoder)
        |> send RemoteData.fromResult
        |> Cmd.map Load


cryptoDisplayDecoder : D.Decoder CryptoDisplay
cryptoDisplayDecoder =
    decode CryptoDisplay
        |> required "cryptoCode" D.string
        |> required "display" D.string


subModelDecoder : D.Decoder SubModel
subModelDecoder =
    decode SubModel
        |> required "cryptoCode" D.string
        |> required "cryptoDisplays" (D.list cryptoDisplayDecoder)
        |> required "fundingAddress" D.string
        |> required "fundingAddressUrl" D.string
        |> required "confirmedBalance" D.string
        |> required "pending" D.string
        |> required "fiatConfirmedBalance" D.string
        |> required "fiatPending" D.string
        |> required "fiatCode" D.string
