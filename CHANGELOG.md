# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## Unreleased

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## v1.12.0 - 2020-03-24

### Changed

- 券種のavailability設定を利用可能アプリケーション設定へ移行
- 利用可能アプリケーション設定とアプリケーション環境変数の連動

## v1.11.0 - 2020-03-21

### Changed

- 券種のavailability設定を利用可能アプリケーション設定へ転換するように調整

## v1.10.0 - 2020-03-19

### Changed

- Cinerinoに対してプロジェクトを明示的に指定するように調整

## v1.9.0 - 2020-03-14

- update @chevre/api-nodejs-client

## v1.8.0 - 2020-03-10

### Changed

- 券種グループサービスをオファーカテゴリーサービスへ移行
- subjectサービスをaccountTitleサービスへ移行
- 券種グループから不要な属性を削除
- 券種検索条件をオファー検索条件に統合

### Fixed

- 配給を登録できないバグ修正

## v1.7.0 - 2020-03-05

### Changed

- update @chevre/api-nodejs-client
- 細目の科目分類と科目を編集不可に変更

## v1.6.2 - 2020-02-23

### Changed

- 券種グループに登録された券種の順序を変更しないように調整

### Fixed

- 注文検索の上映作品選択肢が表示されないバグ対応

## v1.6.1 - 2020-02-06

### Changed

- 興行区分サービスを使用しないように調整
- 配給区分サービスを使用しないように調整
- 券種種別をカテゴリーコード管理から検索するように調整

## v1.6.0 - 2020-02-03

### Changed

- 興行区分をカテゴリーコードに統合
- 配給区分をカテゴリーコードに統合
- update @chevre/api-nodejs-client

## v1.5.0 - 2020-01-29

### Changed

- APIのX-Total-Count削除への対応

## v1.4.0 - 2020-01-27

### Changed

- update @chevre/api-nodejs-client
- update @cinerino/api-nodejs-client
- ページング調整

## v1.3.1 - 2020-01-25

- 各リソース検索についてX-Total-Countが未定義の場合に対応

## v1.3.0 - 2020-01-06

### Changed

- 返品処理中の注文番号をアプリケーション側で管理するように変更

## v1.2.3 - 2019-12-25

### Fixed

- 購入者がWebApplicationの注文を検索できないバグ対応

## v1.2.2 - 2019-10-03

### Changed

- 注文検索結果の購入者名を調整

## v1.2.1 - 2019-10-03

### Changed

- 時間メータ表示設定を追加
- 注文検索結果の券種名を調整

## v1.1.3 - 2019-05-12

### Changed

- イベントが必ず座席指定イベントとして作成されるように調整

## v1.1.2 - 2019-04-24

### Changed

- 券種コード重複チェックを追加
- 券種グループコード重複チェックを追加

## v1.1.1 - 2019-04-24

- Chevreのマルチプロジェクト対応F
- フッターにプロジェクトID追加

## v1.1.0 - 2019-04-22

### Added

- cognitoGroupsによる権限分け機能追加

### Changed

- 興行区分、券種、券種グループのidentifier属性に対応
- 全リソースにプロジェクトを結合

## v1.0.2 - 2019-04-12

### Changed

- update @chevre/api-nodejs-client

## v1.0.1 - 2019-04-10

### Changed

- update @chevre/api-nodejs-client

### Removed

- 使用されていない予約ルーターを削除

## v1.0.0 - 2019-04-05

### Added

- @chevre/api-nodejs-client@1.0.0-alpha.60 @cinerino/api-nodejs-client@2.0.0-alpha.2 で構築
