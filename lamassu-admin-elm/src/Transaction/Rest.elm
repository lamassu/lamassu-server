module Transaction.Rest exposing (..)

import RemoteData exposing (..)
import HttpBuilder exposing (..)
import Http
import HttpBuilder exposing (..)
import BasicTypes exposing (..)
import Common.TransactionTypes exposing (..)
import Transaction.Types exposing (..)
import Transaction.Decoder exposing (txDecoder)


toModel : SavingStatus -> Tx -> SubModel
toModel status tx =
    { status = status, tx = tx }


getForm : String -> Cmd Msg
getForm txId =
    get ("/api/transaction/" ++ txId)
        |> withExpect (Http.expectJson txDecoder)
        |> send (Result.map (toModel NotSaving) >> RemoteData.fromResult)
        |> Cmd.map Load


cancel : String -> Cmd Msg
cancel txId =
    patch ("/api/transaction/" ++ txId ++ "?cancel=true")
        |> withExpect (Http.expectJson txDecoder)
        |> send (Result.map (toModel NotSaving) >> RemoteData.fromResult)
        |> Cmd.map Load
