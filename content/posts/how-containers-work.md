+++
date = '2025-08-02T00:18:30+03:00'
draft = false
title = 'How Do Containers Work'
tags = ['Linux', 'Containers']
+++
# How Do Containers Work?

## Introduction

If you've used Docker or Podman before, you're likely familiar with the concept
of containers. But what exactly is a container? What is it made of? How does it
work? And how does it differ from virtual machines? Even if you think you know
all the answers, you might still learn something new here.

## What is a Container?

When you run a command like this in your terminal:

```sh
docker run --rm -it alpine sh
```

You'll see output similar to the following:

```sh
Unable to find image 'alpine:latest' locally
latest: Pulling from library/alpine
9824c27679d3: Pull complete
Digest: sha256:4bcff63911fcb4448bd4fdacec207030997caf25e9bea4045fa6c8c44de311d1
Status: Downloaded newer image for alpine:latest
/ #
```

Eventually, you're given a shell where you can type commands, install packages,
create users, and do anything else you want.

But what actually happened behind the scenes? The logs tell you that Docker
didn't find the `alpine` image locally, pulled it from a registry, and started
a shell. This is a good high-level summary, but it doesn't explain the
underlying mechanics.

To understand how Docker and Podman work their magic, we first need to look at
some key features of the **Linux kernel**. These features, called
**namespaces** and **cgroups**, allow the Linux kernel to run each process in
isolation from other processes on the system.

## Linux Namespaces

Let's start by exploring Linux namespaces. A Linux namespace is a kernel
feature that controls what a process **can see**. You can think of namespaces
as "boxes" for processes. Each process is contained within a set of these
boxes, and if a process misbehaves (like trying to delete the entire
filesystem), it won't affect other processes that aren't sharing the same
namespaces. You can find a more technical definition by checking the `man
namespaces` page.

At the time of writing, there are 8 namespaces:
* **IPC:** System V IPC, POSIX message queues
* **Network:** Network devices, stacks, ports, etc.
* **Mount:** Mount points
* **PID:** Process IDs
* **Time:** Boot and monotonic clocks
* **User:** User and group IDs
* **UTS:** Hostname and NIS domain name

I also mentioned **cgroups**. While **namespaces** control what a process **can
see**, **cgroups** control the resources a process can use (CPU, memory, disk
I/O, etc.). I won't go into too much detail about cgroups for now, as I believe
understanding namespaces is the most crucial first step to grasping the core
concept of a container.

## Isolating a Process

We can isolate a process using the `unshare` system call, which runs a program
in new namespaces. As specified in the man page:

> The unshare command creates new namespaces (as specified by the command-line
> options described below) and then executes the specified program. If program
> is not given, then "${SHELL}" is run (default: /bin/sh).

Let's start with the UTS namespace. Using this namespace, we can change the
hostname for a process without affecting the host machine it's running on.

```sh
$ sudo unshare --uts bash
root@laptop:/home/limerc#
```

Now, let's change the hostname within this new shell.

```sh
root@laptop:/home/limerc# hostname container
root@laptop:/home/limerc# hostname
container
```

As you can see, the output is now `container`. We've successfully changed the
hostname for this process. Now, let's exit the process by typing `exit` and
check the hostname of the host machine again.

```sh
root@laptop:/home/limerc# exit
exit
~
$ hostname
laptop
```

The hostname of the host machine did not change. This simple experiment
demonstrates how namespaces work: we provided the process with its own hostname
resource, which is independent of the host and other processes.

Next, let's introduce the `PID` namespace. This one is important to understand.
The `PID` namespace isolates the process ID number space. This means the same
process ID **number** can exist in different namespaces. For example, you can't
have two processes with the same ID on your host machine, but you can have PID
1 on your host and another PID 1 inside a namespace. The PID within the
namespace is relative; it's PID 1 from the process's perspective, but it has a
different, unique ID on the host. A demonstration will make this clearer.

I'll run the `unshare` command again with the `--pid` flag to create a new
`PID` namespace. Then, in the new shell, I'll run the `ps` command.

```sh
$ sudo unshare --pid sh
# ps
    PID TTY          TIME CMD
      1 ?        00:00:14 systemd
      2 ?        00:00:00 kthreadd
      ...
```

This output shows all the processes from the host machine. But why? When I
first tinkered with Linux namespaces, I was confused. I thought running `ps`
inside a `PID` namespace would only show processes running within that
"container."

The reason for this behavior is that the `ps` command reads process information
from the virtual filesystem `/proc`, which starts at the root `/`. Even though
our process is isolated by a namespace, the `ps` command is still reading from
the host's `/proc`. To fix this, we need to give the container its own **root**
filesystem.

## Changing the Root (chroot)

There's a command called `chroot`:

> chroot - run command or interactive shell with special root directory

This command does exactly what it says: it changes the filesystem perspective
for a process. You can create an arbitrary directory on your host machine and
use `chroot` to set it as the root for your process.

```sh
$ mkdir process-root
$ sudo chroot process-root
chroot: failed to run command ‘/bin/bash’: No such file or directory
```

The problem is that when we changed the root directory, there was no `/bin`
directory, so `chroot` couldn't find the `/bin/bash` executable. We could fix
this by manually creating a `./process-root/bin` directory and copying `bash`
and its dependencies, but that's a tedious process.

Instead, let's download the Alpine Linux filesystem, which is a very small,
minimal distribution.

```sh
$ curl -LO https://dl-cdn.alpinelinux.org/alpine/v3.22/releases/x86_64/alpine-minirootfs-3.22.1-x86_64.tar.gz

$ tar xzf alpine-minirootfs-3.22.1-x86_64.tar.gz -C process-root/

$ ls process-root/
bin  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
```

As you can see, we downloaded the Alpine root filesystem and extracted it into
the `process-root` directory, which will be the new root for our process.

Now, let's run the `chroot` command again.

```sh
$ sudo chroot process-root sh
/ #
```

It worked\! With `chroot`, we can give a process its own filesystem. Combined
with **namespaces**, we can also give a process its own view of system
resources, like its own PID, hostname, and network interfaces.

Now, let's combine these two approaches.

```sh
$ sudo unshare --pid --fork chroot process-root sh
/ # mount -t proc proc proc
/ # ps
PID   USER      TIME  COMMAND
    1 root      0:00  sh
    3 root      0:00  ps
/ #
```

First, we run `unshare` with the `PID` namespace flag. You might also notice a
new flag: `--fork`. This flag is used to create the shell process as a child of
the `unshare` command. For the sake of this article, I won't go into the
details on that, but you can read about it in `man unshare`.

By combining `unshare` and `chroot`, and then mounting a new virtual `/proc`
filesystem, we've successfully created a truly isolated environment. The `ps`
command can now read from this new `/proc` filesystem, which is populated by
the kernel with only the processes running inside our isolated "container."

## Conclusion

I hope this article was useful. Now you understand the basic mechanics behind
containerization technologies like Docker. You can see that containers are
essentially isolated processes that all share the same Linux kernel, which is
the key difference from how virtual machines work. There's much more to cover,
such as the Mount, IPC, and Network namespaces. I hope to cover those topics in
a future article. Thanks for reading\!
