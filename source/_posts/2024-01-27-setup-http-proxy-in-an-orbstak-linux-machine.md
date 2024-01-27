---
title: 在 orbstack linux machine 中使用主机 http 代理
date: 2024-01-27 16:14:48
tags: nix orbstack
---

OrbStack 提供了 Linux Machine 功能, 可以在 mac os 上得 WSL2 一样的体验.

由于众所周知的原因, 我需要在宿主机上开了 clash 作为代理工具. 在本地的 7890 端口上提供 http 代理, 但没有开全局代理. 只有 firefox 和 github clone 会进过 7890

但这也就导致了 OrbStack  里的 linux 默认是不经过代理.
这里我想要的效果是 linux machine 全走代理. 宿主机还是保持按需使用.

一般这种办法就是通过 shell 设置环境变量 `http_proxy` `https_proxy` `all_proxy` , 但为了通过 home-manager 来自动设置, 花了点时间确定了永久配置的方式.

orbstack 提供了 `host.orb.internal` 作为宿主机的域名, 不用写死 ip 地址.

而 http 环境变量可以通过 systemd 配置 `~/.config/environment.d/30-proxyenv.conf`  注入到整个系统中, 包括其他的服务

```
export all_proxy="http://host.orb.internal:7890"
export http_proxy="http://host.orb.internal:7890"
export https_proxy="http://host.orb.internal:7890"
```

在 home-manager 里, 只配置 sessionVariables 还是不够的. 
这个 `issue` https://github.com/nix-community/home-manager/issues/1011 里给出的解决方案是通过配置 systemd 来实现全局变量注入

```
  home.sessionVariables = {
    https_proxy="http://host.orb.internal:7890";
    http_proxy="http://host.orb.internal:7890";
    all_proxy="http://host.orb.internal:7890";
  };
  systemd.user.sessionVariables = {
    https_proxy="http://host.orb.internal:7890";
    http_proxy="http://host.orb.internal:7890";
    all_proxy="http://host.orb.internal:7890";
  };
```

最后, 执行
```
{nix switch}

systemctl --user import-environment
```

