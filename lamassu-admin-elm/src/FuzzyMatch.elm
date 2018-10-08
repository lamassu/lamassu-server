module FuzzyMatch exposing (match)

import String
import Fuzzy
import Tuple


clean : String -> String
clean s =
    String.trim s
        |> String.toLower


type alias DisplayRec =
    { code : String
    , display : String
    }


score : String -> Int -> DisplayRec -> ( ( Int, Int ), DisplayRec )
score needle index hay =
    let
        match keyword =
            Fuzzy.match [] [] needle keyword
                |> .score

        score =
            List.map match ((String.split " " (clean hay.display)) ++ [ clean hay.code, clean hay.display ])
                |> List.minimum
                |> Maybe.withDefault
                    10000
    in
        ( ( score, index ), hay )


match : String -> List DisplayRec -> List DisplayRec
match rawString list =
    let
        s =
            clean rawString
    in
        if String.isEmpty s then
            list
        else
            List.indexedMap (score s) list
                |> List.sortBy Tuple.first
                |> List.filter (((>) 1100) << Tuple.first << Tuple.first)
                |> List.map Tuple.second
