---
title: Nix 语言初学者上手指南
tags: nix, language
date: 2023-06-17 14:10:38
---


## 前言

由于前阵子 MacBookPro 重新格式化了, 于是用 `nix-darwin` 和 `home-manager` 重新构建了自己的配置管理. 这里写一篇文章记录一些个人对 nix 的学习和总结


## 运行环境和工具

nix 本身是一个语言和包管理工具, 完整的 nix os 体验需要安装的它的发行版, 但个人觉得没必要. nix 也可以在其他 `类 Unix` 系统中使用, 作为系统自带包管理系统的补充.

首先需要安装基础的 nix 环境, 

> `nix` 安装手册 https://github.com/NixOS/nix#installation
> 
> MacOS 用户可以选择安装 https://github.com/LnL7/nix-darwin , 启用系统级的 Nix 集成
> 
> 其他 Linux 发行版, 或者 `wsl2` 用户, 可以通过 `home-manager`, 管理当前 `Home` 目录下的 rc 文件和环境变量,
> 起到和 `homebrew` 等价的效果

安装完毕需要修改默认配置  `~/.config/nix/nix.conf`  启用 nix-command 和 flakes

```
experimental-features = nix-command flakes
allowed-users = root @staff
trusted-users = root @staff
```

以下是可选部分, 使用国内镜像等

```
trusted-substituters = https://mirrors.ustc.edu.cn/nix-channels/store
substituters = https://mirrors.ustc.edu.cn/nix-channels/store https://cache.nixos.org
```

执行 nix 脚本, 有以下两种方式

* `nix eval`  直接执行表达式,在测试函数的时候非常方便
* `nix repl` import 文件执行看结果, 交互式 shell 方便
	* 在表达式之前加 `:p` 可以禁用 lazy eval, 看到最终结果
	* 执行 `:help` 可以看到更多例子

举个 `nix eval` 的简单例子, 可以用这种方式测试本文中的其他例子.

```shell
nix eval --expr '1+1'
nix eval --expr '[ 1 2 3 4]'
```

## 从零熟悉 nix-lang 的基本元素

由于 nix 是函数式语言, 首先需要熟悉它的核心概念 `表达式`

## 函数式和表达式

首先看一下一个 nix 表达式的组成部分

* `with`  引入命名空间部分
* `let ... in` 变量声明部分
* 表达式实际内容

```nix

## with; 命名空间
with import <nixpkgs> {};
with libs;

## 定义变量和新函数; 每个语句以 `;` 结束
let
	a =1 ;
	join = (strs: conatStringSep "" strs);
in
	join [ "a" "b" "c" ]  # 表达式不需要 `;`` 结尾
	
```

with 语句在当前表达式作用域 (`scope` ) 中直接使用它的内部属性/方法, 可以减少代码长度.

```
/*改写前*/
builtins.concatStringsSep "," (builtins.map (p : "v"+p) [ "1" "2" "3" ])
/*改写后*/
with builtins; concatStringsSep "," (map (p : "v"+p) [ "1" "2" "3" ])
```

普通 set 变量也是可以用 `with`  导入当前 `scope` 

```
let
   values = { a =1; b=2 ;};
in
   with values ; a+b
```

这几个元素可以在表达式的内部继续嵌套使用, 举一个嵌套表达式的例子

```
nix-repl> let a = ["a"]; in (let b = ["b"]; in with lib; a ++ b )
[ "a" "b" ]
```


> ! 但复杂语法深度套娃, 最终结果会非常难读.
> 过度炫技不可取.


### 类型和集合

#### 基本类型

关于基础类型这里就不展开了, 基本的 `bool`, `int`, `string` 和大部分语言差异不大.

> 见 https://nixos.org/manual/nix/stable/language/values.html

#### 集合类型

在 nix 里 集合类型主要需要了解 `lists` 和 `sets` ( `attribute set`)

* list : 数组类型
* set : 字典或者 map

```nix
[ "one" "two" "three" ]

{ key1 = "value1"; key2 = "value2"; }
```


> 在写 nix 的过程中, 我个人经常会感到对 集合语法上的不适应, 主要原因是它在语法上和其他语言存在差异. 大部分时候, 我总感觉如果 nix 使用 `,` 作为分隔符对其他语言的使用者来说会更容易习惯.
> nix wiki 也提到, 在 `nix`  中 ';' 扮演了其他语言中 `,` 的角色. 所以在 nix 没有出现 `,` 是因为已经选择了 `;` 

```nix
# 数组成员间不需要 `;` 隔开, 也不要习惯性地使用 `,`
alist = [ 1 2 3 ]  ; 

# 见 https://nixos.org/guides/nix-pills/basics-of-language.html#idm140737320545296

# set 成员需要 `;` 分隔
aSet = {
 a = [];
 b = "strs";
 c = 1;
};
# 更多例子见 https://nixos.org/guides/nix-pills/basics-of-language.html#idm140737320542544
```

还有其他类型

* string https://nixos.org/guides/nix-pills/basics-of-language.html#idm140737320577792
* derivation https://nixos.org/guides/nix-pills/our-first-derivation.html 关于 derivation , 需要很长的展开, 篇幅原因这里就先跳过了.
* URL 和 Path  也很重要, 但这块后面写包管理的时候再展开了.

更多常见类型, 见官方 wiki , http://www.binaryphile.com/nix/2018/07/22/nix-language-primer.html


### 函数基础


### 无名参数函数(nameless parameter function)

最基础的函数定义 (传统函数风格) ,  使用参数按顺序传入

> 函数定义的风格写法有好几种, 个人建议定义函数使用第一种或者第二种
> 调用语法, 个人习惯第一种,  `()` 使用多了会导致语句不易读, 陷入了 LISP 语法的笑话

```nix
let
  plus = (a: b: a + b ); 
  plus2 = a: b: a+b;
  plus3 = (a: (b: a+b));
  plus4 = a: (b: a+b);
in  (plus 1 2) + plus2 (1) (2)  + plus3(1) 2

>> 9

```

作为函数式语言, 不难发现 nix 也是支持 curry 的.

```nix
let
 plus = a: b: a+b;
 plus1 = plus(1);
in
 plus1(plus1(2))

>> 4
```

>由于  `:` 后面的函数体是一个表达式, 因此可以加入 `let ... in`  定义中间变量.

>另外, 在中间语句中加入 with 也是很常见的, 大部分库代码或者包描述中都可以看到.


```
let
  values = { c=2; };
  plus1 = a: with values; let b=1; in a+b+c;
in
  plus1 2

>> 3
```

#### 命名参数函数

首先举一个复杂的可变参数长度的例子开场:

```nix
let func = {a, b, c, ...} : a+b+c in  func { a=1; b=2; c=3; d=4;}
```

如果获取可变参数中的变量, 可以通过 `@` 引用的参数列表, 这里使用 args 作为变量名.

```nix
let func = {a, b, c, ...}@args: a+b+c+args.d; in  func { a=1; b=2; c=3; d=4;}
```

通过nix 的 `命名参数` 函数定义可以看出来, 类似于把函数的传入参数变成一个 attribute set.

等价于单参数的函数的一个语法糖,以下举几个例子, 函数 `fun` 采用了`无名参数`, 但使用效果和`命名参数`是一样的.

> 
> `let fun = p:  with p ; a+b ; in fun { a=1; b=2;}`
> 等价于  `let fun = { a, b }: a+b ; in fun { a=1; b=2;}`
>
> `let fun = p:  with p ; a+b+p.c ; in fun { a=1; b=2; c=3;}`
> 等价于  `let fun = { a, b }@args : a+b+args.c ; in fun { a=1; b=2; c=3; }`

可能由于大量同名赋值的存在, `nix` 还提供了 `inherit`  关键字, 简化了形参的代码书写.

> `inherit` 关键字可以起到类似 `with` 的作用, 省掉了把同名参数写一遍的功夫

```nix
let
  fun = { a, b }: a+b;
  attrs = { a =1 ; b=2; };
in fun { 
	inherit (attrs) a b;
}
```

 还有另外的写法

```nix
let
  fun = { a, b }: a+b;
  b = 2;
in fun { 
	a=2;
	inherit b;
}

```


回到 `命名参数` 话题本身

这里举例只是做对比, 既然有语法糖, 直接用比较爽.

相比前面的例子,  使用语言内置命名参数, 比较方便地使用默认参数.

* 默认参数 `func = {a, b, c? 3, ...} : a+b+c`


```
:p let
func = {a, b, c, ...} : a+b+c;   #可变参数列表
func2 = {a, b, c?3 }: a+b+c;
in 
[ func{ a=1; b=2; c=3; } func2{ a=1; b=2; } ]
```

总结一下, 命名形参的函数定义, 相对于匿名参数有以下好处: 

* 防止多参数太长不可读
* 参数支撑默认值
* 可变参数访问 `@xxx`

> 更多例子见官方文档  https://nixos.org/guides/nix-pills/functions-and-imports.html#idm140737320477216


> 注意, 不能像 c 语言一样用方括号包裹表达式, 否则就变成了一个返回值为 set 的函数了.

```
{a, b, c, ...}: {}  #返回值是 set
```


### 函数手册

nix 缺乏一个好的函数查找工具. 目前只能通过文档查找

* `builtins.*` https://nixos.org/manual/nix/stable/language/builtins.html
* `nixpkgs.lib.*`  https://nixos.org/manual/nixpkgs/stable/#sec-functions-library


## 参考文章


* 官方手册 https://nixos.org/manual/nix/stable/language/index.html
* nix-language-primer http://www.binaryphile.com/nix/2018/07/22/nix-language-primer.html 