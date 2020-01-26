# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## Unreleased

### Added

### Changed

- update @chevre/api-nodejs-client
- update @cinerino/api-nodejs-client
- ページング調整

### Deprecated

### Removed

### Fixed

### Security

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
