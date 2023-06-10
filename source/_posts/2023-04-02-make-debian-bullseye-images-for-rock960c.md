---
title: 制作 rock960c 的 debian 11  系统镜像
date: 2023-04-02 20:02:04
tags: sbc, debian
---

rock960 是一块不太常见的 96boards 规范得的 rk3399 单板，目前厂家已经不维护了（email咨询得知）， 不过还好他们邮件给了可以下载最新固件的地址，需要稍微处理以下就可以得到更新的 debian固件

* [板子官网](http://www.96boards.org/product/rock960/)

## 通过二次刷写升级到更新的 debian 系统

从这里下载最后一次更新的 rock960c 镜像 https://www.96boards.org/documentation/consumer/rock/downloads/debian.md.html

首先通过常规方式， 进入 maskroom 模式。

> 具体过程省略

通过 `RKDevTool_Release_v2.86` 把最基本的 debian9 镜像写入 `emmc`， 完成基础版本的刷入。

以下是需要的配置的分区地址

* 0x0 loader.bin -- 这个 loader 负责引导进入分区刷写模式，每次刷入系统都需要加上0x0 gpt.image -- 完整镜像，包含了 boot 等5个分区， 必须从 0 开始写入

从 https://sd-card-images.johang.se/boards/rock960.html 这里可以下载到 rock960 的更新版本 debian 镜像。

> 这里只下载debian-bullseye-arm64-iey4ku.bin.gz , boot-rock960.bin.gz 不用下载

通过执行 `7z x debian-bullseye-arm64-iey4ku.bin.gz`, 解压后将得到 ext4.img， 这是Debian 的 rootfs 根目录分区

从官方手册里 rootfs 的写入命令

```
rkdeveloptool wl 262144 rootfs.img
```

> 这里 262144 是十进制， 换算成16进制就是 0x00040000

再次进入 `mask room` 模式

按以下地址刷入 `rootfs` 镜像文件

* 0x0 loader.bin -- 每次更新`loader`都需要放在首位
* 0x00040000 ext4.img - 因为只是覆盖 `rootfs` ，需要写上正确的偏移地址

完成刷入之后， 重启得到一个全新版本的 debian 11.

## 接入网络安装更多包

由于 sd-card-images 的镜像非常小， 这里需要先通过网络安装常用的 deb 包。

我是通过usb 以太网转接器接入并安装 network-manager 得到无线接入能力。

```bash
apt install sudo iproutes apt-utils fdisk network-manager vim zsh screen
```

顺便加个新用户


```bash
useradd -m -G sudo -s /bin/sh rock960 
password rock960
```

安装完 network-manager，通过 nmtui-connect 就可以通过 TUI 方便地连上无线了。 root 分区容量扩容

ext4.img 刷入完毕，root 分区的可用容量仅2G， 而 rock960c 的 emmc 容量是 16G， 这里需要通过 resize2fs /dev/mmcblk1p5 命令完成根分区的自动扩容。 


## 附录

成品镜像 root password: iey4ku

[rock960c_debian_bullseye-arm64-iey4ku-pre1](https://github.com/hitsmaxft/rock960-debian-images/releases/tag/rock960c_debian_bullseye-arm64-iey4ku-pre1)

github 项目地址

https://github.com/hitsmaxft/rock960-debian-images


