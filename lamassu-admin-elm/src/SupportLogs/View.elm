module SupportLogs.View exposing (..)

import Html exposing (..)
import Html.Attributes exposing (href)
import Css.Admin exposing (..)
import Css.Classes as C
import RemoteData exposing (..)
import List
import Common.Logs.Types exposing (..)
import SupportLogs.Types exposing (..)
import Date exposing (..)
import Date.Extra exposing (toFormattedString)


supportLogText : SupportLog -> Html Msg
supportLogText supportLog =
    text (supportLog.name ++ " " ++ (toFormattedString "yyyy-MM-dd HH:mm" supportLog.timestamp))


supportLogLink : SupportLog -> Html Msg
supportLogLink supportLog =
    a [ href ("/#support_logs/" ++ supportLog.id) ] [ supportLogText supportLog ]


formatDate : Date -> String
formatDate date =
    toFormattedString "yyyy-MM-dd HH:mm" date


rowView : Log -> Html Msg
rowView log =
    tr [ class [] ]
        [ td [] [ text (formatDate log.timestamp) ]
        , td [] [ text log.logLevel ]
        , td [] [ text log.message ]
        ]


supportLogItemView : SupportLog -> Html Msg
supportLogItemView supportLog =
    li [] [ supportLogLink supportLog ]


supportLogsView : SupportLogs -> Html Msg
supportLogsView supportLogs =
    if List.isEmpty supportLogs then
        div [ class [ C.EmptyTable ] ] [ text "No shared logs" ]
    else
        div []
            [ div [ class [ C.TxTable ] ]
                [ ul [] (List.map supportLogItemView supportLogs)
                ]
            ]


supportLogs : Model -> Html Msg
supportLogs model =
    case model.supportLogs of
        NotAsked ->
            div [] []

        Loading ->
            div [] [ text "Loading snapshots ..." ]

        Failure err ->
            div [] [ text (toString err) ]

        Success supportLogs ->
            div [] [ supportLogsView supportLogs ]


logsView : Logs -> Html Msg
logsView logs =
    if List.isEmpty logs.logs then
        div [] [ text "No logs yet." ]
    else
        div []
            [ table [ class [ C.TxTable ] ]
                [ thead []
                    [ tr []
                        [ td [] [ text "Date" ]
                        , td [] [ text "Level" ]
                        , td [] [ text "Message" ]
                        ]
                    ]
                , tbody [] (List.map rowView logs.logs)
                ]
            ]


logs : Model -> Html Msg
logs model =
    case model.logs of
        NotAsked ->
            div [] []

        Loading ->
            div [] [ text "Loading logs..." ]

        Failure err ->
            div [] [ text "No logs yet." ]

        Success logs ->
            div []
                [ logsView logs
                ]


view : Model -> Html Msg
view model =
    div []
        [ h1 [] [ text "Lamassu support logs" ]
        , div [ class [ C.PaneWrapper ] ]
            [ div [ class [ C.LeftPane ] ]
                [ h2 [] [ text "Shared snapshots" ]
                , supportLogs model
                ]
            , div [ class [ C.ContentPane ] ]
                [ h2 [] [ text "Logs" ]
                , logs model
                ]
            ]
        ]
