---
title: nix and home-manager, 最好的系统环境管理工具
tags: nix, dotfiles
date: 2023-06-11 11:07:26
---

## 前言

> 由 chatgpt 生成...

在当今的技术领域，配置管理变得越来越重要。对于开发者和技术爱好者来说，保持一致的开发环境和工具配置是至关重要的。然而，传统的配置文件管理方式可能会导致配置分散、混乱和难以维护的问题。

幸运的是，有一个强大的工具可以帮助我们解决这些问题，那就是home-manager。Home-manager是一个基于Nix的工具，旨在帮助用户统一管理他们的配置文件，并通过声明性的方式进行配置。

本文将介绍如何安装home-manager以及使用它来管理一些常见的配置文件，例如zsh、bash和vim。我们将探索如何使用home-manager的内置功能和插件来简化配置文件的管理，并介绍如何定制和贡献新的配置。

## 使用 yadm 和 home-manager 协同维护系统配置



* `home-manager` 声明式, 函数式, 面向终态的用户配置管理方案
* `yadm` 完成将配置文件同步到 github


## 安装 home-manager

假设当前系统处于初始化状态, 这里首先更新 channel , 接着安装最新的 home-manager.

> 官方安装教程 https://nix-community.github.io/home-manager/index.html#sec-install-standalone
> 可选的方式还有通过 flake 加载.

```shell
nix-channel --add https://github.com/nix-community/home-manager/archive/master.tar.gz home-manager 
nix-channel --update

nix-shell '<home-manager>' -A install
```

安装完毕, home-manager 会自动生成一个最小化配置在 `~/.config/home-manager/home.nix`  这个文件中. 这里 home-manager 的可以告一段落

> 官方文档中会提及修改 `.profile` 等操作. 这部分会在 `program` 段落中进行.

## 通过 yadm 将配置文件同步到 github


在通过 nix-shell 载入 yadm 和相关软件, 通过执行 `nix-shell -p pkg1 pkg2` , 可以快速得到临时环境

> 假设我们的 dotfiles 将上传到 `$GIT_USER` 这个用户名下的 `dotfiles` 仓库.
> 那么 github 全路径为 `git@github.com:${GIT_USER}/dotfiles.git`


```bash
yadm init
yadm add ~/.config/home-manager/home.nix
yadm commit -m 'add home.nix'
yadm remote add origin git@github.com:${GIT_USER}/dotfiles.git

```

如果仓库中没有任何内容, 这是应该直接推送到 `master` 分支, (或者 main )

```bash
yadm push -u origin master
```

> 假设你已经有现成的 dotfiles, 可以直接执行 `yadm clone git@github.com:${GIT_USER}/dotfiles.git` 一步初始化


## home.program: 声明式管理shell 环境

home-manager 可以用于替代 `stow` 和 `homebrew` , 通过在 `~/.nix-profile/bin` 下加入软链等, 方便地管理当前环境中的各种工具.

对于经常需要修改开发环境的开发者

`home.programs` 内置了大量 常用 shell 命令的配置, 通过这些配置项, 一方面自动化往当前 home.nix 中增加 `nix` package, 同时还能生成对应的配置文件, 替代手动管理配置文件.

解决了配置文件分散在各个目录和文件下的脏乱差现场, 现在配置文件都托管给了 nix  通过 `home-manager`  进行集中化管理, 同时

> 社区中大量已经贡献进来的 programs 配置项不仅可以直接使用, 后面会介绍如何通过 `import` 定制已有的 `program` .
> 当然可以也新增自己的 program 实现, 最后贡献给 `home-manager` 社区.

接下来章节中, 首先介绍一些常见场景下的 `home-manager` 使用案例

* zsh
* bash
* vim

### 热身开始, 通过 nix 管理 zsh 配置文件

过去配置 zsh, 一般是通过修改 `.zshrc` `.zprofile` 和 `.zshenv` 这些文件, 如果需要同步到不同机器, 可以借助 `yadm` 同步到 `github` .

随着 shell 的配置项的代码量不断膨胀, 

通过 `home-manager`, 

以下是一个 `zsh` 的配置实例, 内置了一部分常用的 `zsh` 特性.

* 内置 `oh-my-zsh` , 启用 `vi-mode`  和  `jump` 插件
* `.zshenv` 加入 nix 环境变量 (这就是前面安装 nix 环境中跳过的部分)
	* `envExtra` 
* `.zshrc`  加入自定义选项
	* `initExtraFirst`  这部分脚本会在 .zshrc 最前面, 先于 `oh-my-zsh` 和其他脚本
	* `initExtra` 这部分脚本优先级低于其他的
	* TODO

```nix
{pkg, ...} : 
{
	home.programs = {
		zsh = {
			enable = true;
			oh-my-zsh = {
				enable = true;
				plugins = [
					"vi-mode"
					"jump"
				]
				
			};
			
			envExtra = ''
if [ -e ''${HOME}/.nix-profile/etc/profile.d/nix.sh ]; then . ''$HOME/.nix-profile/etc/profile.d/nix.sh; fi # added by Nix installer

			'';
			initExtraFirst = ''
			'';
			initExtra = ''
			'';


		};
	};
}
```

### 管理 bash 配置

接下来是一个 `bash` 的配置实例.

给 bash 内置了`补全`功能和 `starship` (类似 p10k 的 zsh 提示符主题, rust 实现, 需要预先在 packages 中安装)

```nix
{
	home.packages = [

		starship
	];
    programs = {
    bash = {
        enable = true;
        enableCompletion = true;
        initExtra = ''
          eval "$(starship init bash)"
          '';
      };
    };
}
```

在 `.bashrc` 中, 可以看到最终效果为:

```bash
if [[ ! -v BASH_COMPLETION_VERSINFO ]]; then
  . "/nix/store/*******-bash-completion-2.11/etc/profile.d/bash_completion.sh"
fi

# init starship prompt
eval "$(starship init bash)"
```


### 管理 vim 配置

### 通过 `import` 管理自定义 `program`

假设已经开发了一个名叫 `xxx` 的 program, 放在了 `home-manager/modules` 配置目录下.

```nix
#~/.config/home-manager/modules/xx.nix
{ config, lib, ... }:
let
  cfg = config.programs.xxx;
in {
  options.programs.xxx = {
    enable = lib.mkEnableOption "xxx";

    settings = lib.mkOption {
      default = { };
      type = lib.types.attrsOf lib.types.str;
      example = lib.literalExpression ''
        {
          XXX_LOADED = "yes";
        }
      '';
      description = lib.mdDoc
        "XXX config";
    };
  };
  config = lib.mkIf cfg.enable {
    home = {
      sessionVariables = cfg.settings;
    };
  };
}
```

接下来需要在 home.nix 中通过 `import` 导入 `xxx`

```nix
# home.nix
{}:
{
  imports = [ ./modules/xxx.nix ];

  programs = {
    sd = {
        enable = true;
        settings = {
          XXX_LOADED = "yes";
        };
    };

  };
}
```


## 通过 overlay 增加自定义函数和应用包


这里举一个例子, 往 `<nixpkgs>` 中新增 `vim-darwin` 包.

* 关闭 GUI 
* 开启 darwin 特性, vim 和 mac 剪贴板交互需要开启该编译选项
* 内置两个基础插件


```nix
# ~/.config/home-manager/overlays/default.nix

final: prev: 
let
	pkgs = prev
in
{
    vim-darwin =  pkgs.vim-full.customize {
      vimrcConfig.packages.default = {
        gui = true;
        darwin = true;
        start = [
          pkgs.vimPlugins.vim-nix
          pkgs.vimPlugins.vim-plug
        ];
      };
    };
}
```

完成上面的基础 `overlays` 脚本, 接下来需要在 home-manager 中引用.

```nix
#  ~/.config/home-manager/home.nix

{pkgs, ...} : {

  nixpkgs.overlays = [ 
    (import ./overlays/default.nix)
  ];

}
```


再次运行 `home-manager switch` 完成 `overlays` 加载

最后, 再次修改 `home.nix` 的 `home.pacakges` 完成 `vim-darwin` 的安装

```nix

{pkgs, ...} : {

  nixpkgs.overlays = [ 
    (import ./overlays/default.nix)
  ];

  home.packages = [
	vim-darwin
  ]

}

```