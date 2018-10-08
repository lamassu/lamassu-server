module Transaction.View exposing (..)

import Html exposing (..)
import Html.Events exposing (onClick)
import RemoteData exposing (..)
import Common.TransactionTypes exposing (..)
import Transaction.Types exposing (..)
import Numeral exposing (format)


-- import Css.Admin exposing (..)
-- import Css.Classes as C


cashInTxView : CashInTxRec -> Html Msg
cashInTxView tx =
    let
        cancelStatus =
            if tx.operatorCompleted then
                "Cancelled"
            else if tx.sendConfirmed then
                "Sent"
            else if tx.expired then
                "Expired"
            else
                "Pending"

        cancellable =
            not (tx.operatorCompleted || tx.sendConfirmed || tx.expired)

        cancelButtonDiv =
            if cancellable then
                div []
                    [ button [ onClick (Cancel tx.id) ] [ text "Cancel transaction" ]
                    ]
            else
                div [] []

        error =
            Maybe.withDefault "Successful" tx.error
    in
        div []
            [ div [] [ text tx.id ]
            , div [] [ text "This is a cash-in transaction" ]
            , div [] [ text ("Fiat: " ++ (format "0,0.00" tx.fiat)) ]
            , div [] [ text ("Status: " ++ cancelStatus) ]
            , div [] [ text error ]
            , cancelButtonDiv
            ]


cashOutTxView : CashOutTxRec -> Html Msg
cashOutTxView tx =
    let
        error =
            case tx.error of
                Nothing ->
                    "No errors"

                Just err ->
                    "Error: " ++ err
    in
        div []
            [ div [] [ text tx.id ]
            , div [] [ text "This is a cash-out transaction" ]
            , div [] [ text ("Fiat: " ++ (format "0,0.00" tx.fiat)) ]
            , div [] [ text error ]
            ]


txView : SubModel -> Html Msg
txView subModel =
    case subModel.tx of
        CashInTx cashInTxRec ->
            cashInTxView cashInTxRec

        CashOutTx cashOutTxRec ->
            cashOutTxView cashOutTxRec


view : Model -> Html Msg
view model =
    case model of
        NotAsked ->
            div [] []

        Loading ->
            div [] [ text "Loading..." ]

        Failure err ->
            div [] [ text (toString err) ]

        Success subModel ->
            txView subModel
