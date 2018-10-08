module Transactions exposing (..)

import Html exposing (..)
import Html.Attributes exposing (colspan, href)
import Css.Admin exposing (..)
import Css.Classes as C
import RemoteData exposing (..)
import Http
import HttpBuilder exposing (..)
import Transaction.Decoder exposing (txsDecoder)
import Common.TransactionTypes exposing (..)
import List
import Numeral exposing (format)
import Date.Extra exposing (toFormattedString)
import Maybe.Extra exposing (isJust)


type alias Txs =
    List Tx


type alias Model =
    RemoteData.WebData Txs


init : Model
init =
    NotAsked


loadCmd : Cmd Msg
loadCmd =
    getTransactions


load : ( Model, Cmd Msg )
load =
    ( Loading, loadCmd )


getTransactions : Cmd Msg
getTransactions =
    get ("/api/transactions")
        |> withExpect (Http.expectJson txsDecoder)
        |> send RemoteData.fromResult
        |> Cmd.map Load


type Msg
    = Load Model


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Load loadedModel ->
            loadedModel ! []


multiplier : CryptoCode -> Float
multiplier code =
    case code of
        BTC ->
            1.0e8

        BCH ->
            1.0e8

        ETH ->
            1.0e18

        ZEC ->
            1.0e8

        DASH ->
            1.0e8

        LTC ->
            1.0e8



txLink : String -> Html Msg
txLink txId =
    a [ href ("/#transaction/" ++ txId) ] [ text (String.left 8 txId) ]


cryptoCodeDisplay : CryptoCode -> Html Msg
cryptoCodeDisplay code =
    let
        txt : String
        txt = case code of
            BTC -> "BTC"
            BCH -> "BCH"
            ETH -> "ETH"
            ZEC -> "ZEC"
            DASH -> "DASH"
            LTC -> "LTC"
    in
        text txt

rowView : Tx -> Html Msg
rowView tx =
    case tx of
        CashInTx cashIn ->
            let
                rowClasses =
                    if cashIn.operatorCompleted then
                        [ C.CashIn, C.TxCancelled ]
                    else
                        [ C.CashIn ]

                status =
                    if isJust cashIn.error then
                        "Error"
                    else if cashIn.operatorCompleted then
                        "Cancelled"
                    else if cashIn.sendConfirmed then
                        "Sent"
                    else if cashIn.expired then
                        "Expired"
                    else
                        "Pending"
            in
                tr [ class rowClasses ]
                    [ td [] [ txLink cashIn.id ]
                    , td [] [ text status ]
                    , td
                        [ class [ C.NumberColumn ] ]
                        [ text (toFormattedString "yyyy-MM-dd HH:mm" cashIn.created) ]
                    , td [] [ text cashIn.machineName ]
                    , td [ class [ C.NumberColumn ] ]
                        [ text (format "0,0.000000" ((toFloat cashIn.cryptoAtoms) / multiplier cashIn.cryptoCode))
                        ]
                    , td [] [ cryptoCodeDisplay cashIn.cryptoCode ]
                    , td [ class [ C.NumberColumn ] ] [ text (format "0,0.00" cashIn.fiat) ]
                    , td [ class [ C.NumberColumn ] ] [ text (Maybe.withDefault "" cashIn.phone) ]
                    , td [ class [ C.TxAddress ] ] [ text cashIn.toAddress ]
                    ]

        CashOutTx cashOut ->
            let
                status =
                    if isJust cashOut.error then
                        "Error"
                    else if cashOut.dispense then
                        "Success"
                    else
                        "Pending"
            in
                tr [ class [ C.CashOut ] ]
                    [ td [] [ txLink cashOut.id ]
                    , td [] [ text status ]
                    , td [ class [ C.NumberColumn, C.DateColumn ] ] [ text (toFormattedString "yyyy-MM-dd HH:mm" cashOut.created) ]
                    , td [] [ text cashOut.machineName ]
                    , td [ class [ C.NumberColumn ] ]
                        [ text (format "0,0.000000" ((toFloat cashOut.cryptoAtoms) / multiplier cashOut.cryptoCode))
                        ]
                    , td [] [ cryptoCodeDisplay cashOut.cryptoCode ]
                    , td [ class [ C.NumberColumn ] ] [ text (format "0,0.00" cashOut.fiat) ]
                    , td [ class [ C.NumberColumn ] ] [ text (Maybe.withDefault "" cashOut.phone) ]
                    , td [ class [ C.TxAddress ] ] [ text cashOut.toAddress ]
                    ]


tableView : Txs -> Html Msg
tableView txs =
    if List.isEmpty txs then
        div [] [ text "No activity yet." ]
    else
        table [ class [ C.TxTable ] ]
            [ thead []
                [ tr []
                    [ td [ class [ C.TxId ] ] [ text "Id" ]
                    , td [] [ text "Status" ]
                    , td [ class [ C.TxDate ] ] [ text "Time" ]
                    , td [ class [ C.TxMachine ] ] [ text "Machine" ]
                    , td [ colspan 2 ] [ text "Crypto" ]
                    , td [ class [ C.TxAmount ] ] [ text "Fiat" ]
                    , td [ class [ C.TxPhone ] ] [ text "Phone" ]
                    , td [ class [ C.TxAddress ] ] [ text "To address" ]
                    ]
                ]
            , tbody [] (List.map rowView txs)
            ]


view : Model -> Html Msg
view model =
    case model of
        NotAsked ->
            div [] []

        Loading ->
            div [] [ text "Loading..." ]

        Failure err ->
            div [] [ text (toString err) ]

        Success txs ->
            div [] [ tableView txs ]
