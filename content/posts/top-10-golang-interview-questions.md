+++
date = '2025-08-28T11:32:00+03:00'
draft = false
title = 'Top 10 Golang Interview Questions'
toc = true
tags = ['golang', 'interview', 'programming']
+++

If you’re preparing for a Go interview, I’ve put together my top 10 list of the
most commonly asked questions. I collected these questions myself while going
through many Golang interviews. This guide walks you through ten questions
you’ll almost certainly encounter, starting from the fundamentals and moving up
to concurrency.

**For each answer, I also provide references that I highly recommend reading to gain a deeper understanding.**

---

## 1. What is a slice and how is it different from an array?

Slices are Go's "dynamic array" and show up everywhere.\
A slice is a **descriptor** —`pointer, len, cap` — over an underlying array[^1]. Slicing **shares** that array; `append` may **reallocate** to a new one.

```go
package main

import "fmt"

func main() {
    s := make([]int, 0, 2)
    s = append(s, 1, 2)      // len=2 cap=2
    p := &s[0]

    s = append(s, 3)         // reallocates
    fmt.Println("len/cap:", len(s), cap(s))
    fmt.Println("same backing?", p == &s[0]) // false after growth
}
```


---

## 2. Are maps ordered in Go?

Interviewers love this because it trips up people coming from other languages.\
So the answer is **No.** Iteration order is **not specified**[^2] and can change from run to run. Don't rely on it.


```go
package main

import "fmt"

func main() {
    m := map[string]int{"a": 1, "b": 2, "c": 3}
    for k := range m {
        fmt.Print(k, " ") // order is not guaranteed
    }
}
```


---

## 3. Can a struct be a map key?

This question tests whether you understand **comparability**, a cornerstone of Go's type system.\
Yes — **if all fields are comparable**[^3][^4] (no slices, maps, or funcs).

```go
package main

import "fmt"

type Key struct{ X, Y int } // comparable

func main() {
    m := map[Key]string{{1, 2}: "ok"}
    fmt.Println(m[Key{1, 2}]) // "ok"
}
```


---

## 4. What is an interface and how can a "nil interface" surprise you?

This is the most common Go pitfall when returning `error`.
You can think of an interface as a tuple of values **(type, value)**[^6].\
It's only `nil` if **both** are nil[^5]. A typed `nil` (e.g., `(*T)(nil)`) stored in an interface
makes the interface **non-nil**.

```go
package main

import "fmt"

type myErr struct{ msg string }
func (e *myErr) Error() string { return e.msg }

func mightFail() error {
    return (*myErr)(nil) // typed-nil inside an interface
}

func main() {
    err := mightFail()
    fmt.Println(err == nil) // false
    fmt.Printf("%T %v\n", err, err)
}
```


---

## 5. What is a goroutine and how is it different from a thread?

Concurrency is Go's superpower.\
A goroutine has a simple model: it is a function executing concurrently with other goroutines in the same address space.
Goroutines are **lightweight**[^7]; the runtime multiplexes many goroutines onto a **small pool** of OS threads (M:N). `GOMAXPROCS` caps parallelism[^8].

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func main() {
    var wg sync.WaitGroup
    for i := 0; i < 3; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            time.Sleep(50 * time.Millisecond)
            fmt.Println("goroutine", id)
        }(i)
    }
    wg.Wait()
}
```


---

## 6. What is a channel? (Buffered vs Unbuffered)

Channels are Go's idiomatic way to coordinate work.\
Channels are typed **pipes**[^9].

* **Unbuffered**: sender and receiver synchronize at handoff.
* **Buffered**: sender blocks only when the buffer is full.

```go
package main

import "fmt"

func main() {
    unbuf := make(chan int)   // unbuffered
    go func(){ unbuf <- 42 }()
    fmt.Println(<-unbuf)

    buf := make(chan string, 2)
    buf <- "a"; buf <- "b"    // doesn't block until full
    fmt.Println(<-buf, <-buf)
}
```


---

## 7. Nil channels, closed channels, and who should close a channel?

These edge cases differentiate beginners from pros.
* **Nil channel**: send/receive **block forever**[^10]; `close(nil)` panics[^12].
* **Closed channel**: receive returns **zero value** with `ok=false`[^10]; **send panics**[^11].
* **Who closes?** The **sender/owner** closes to signal "no more values."

I recommend you to read fantastic post about [channels axioms by Dave Cheney](https://dave.cheney.net/2014/03/19/channel-axioms).

```go
package main

import "fmt"

func main() {
    var nilch chan int
    select {
    case <-nilch: // blocks forever
    default:
        fmt.Println("nil channel would block")
    }

    c := make(chan int)
    close(c)
    v, ok := <-c
    fmt.Println(v, ok) // 0 false
}
```


---

## 8. Which sync primitives does Go provide and when do you use them?

Not every problem is a channel problem.

* `sync.Mutex` / `sync.RWMutex` (protect state).
* `sync.WaitGroup` (wait for goroutines).
* `sync.Once` (one-time init).
* `sync/atomic` (counters/flags with memory ordering)[^13][^14].

Channels are great for **handoff**; locks are great for **protection**.

```go
package main

import (
    "fmt"
    "sync"
    "sync/atomic"
)

func main() {
    var mu sync.Mutex
    var n int64
    var wg sync.WaitGroup
    var once sync.Once

    init := func(){ fmt.Println("init once") }

    for i := 0; i < 3; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            once.Do(init)
            mu.Lock(); n++; mu.Unlock()
            atomic.AddInt64(&n, 1)
        }()
    }
    wg.Wait()
    fmt.Println("n =", n)
}
```


---

## 9. `map` vs `sync.Map` — when to use which?

Concurrency + performance trade-offs.

For most cases, use a normal `map` + your own locking or confinement.\
`sync.Map` is specialized for **read-mostly** workloads[^15] with infrequent updates (e.g., caches).

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var sm sync.Map
    sm.Store("k", 1)
    if v, ok := sm.Load("k"); ok {
        fmt.Println(v)
    }
}
```


---

## 10. What is `context` and why is it important?

This is how you build cancelable, production-grade services.

`context.Context` carries **deadlines**, **timeouts**, **cancellation signals**, and **request-scoped values**[^16][^17].\
Pass it as the **first argument**, derive per request, **never store** it, and **always call** the cancel func you get from `WithCancel/WithTimeout/WithDeadline`.

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
    defer cancel()

    done := make(chan struct{})
    go func() {
        defer close(done)
        select {
        case <-time.After(1 * time.Second):
            fmt.Println("work finished")
        case <-ctx.Done():
            fmt.Println("canceled:", ctx.Err())
        }
    }()
    <-done
}
```


---

## Bonus

* **Race detector:** Run `go test -race` or `go run -race` to catch data races early[^18].
* **Go memory model & GC:** If they go deep, know that Go uses a **concurrent mark-and-sweep** GC with short pauses, and the **memory model** defines "happens-before"[^19][^20].

---

## Conclusion

If you can explain these ten topics clearly, with a calm one-liner and a tiny
example, you'll look confident and practical. Read this post before an
interview, run a few snippets, and you'll be in great shape.

---

## References

[^1]: [Effective Go - Slices](https://go.dev/doc/effective_go#slices)
[^2]: [Language Spec - Map types](https://go.dev/ref/spec#Map_types)
[^3]: [Effective Go - Maps](https://go.dev/doc/effective_go#maps)
[^4]: [Language Spec - Comparison operators](https://go.dev/ref/spec#Comparison_operators)
[^5]: [Go FAQ - nil error](https://go.dev/doc/faq#nil_error)
[^6]: [Go Blog - Laws of Reflection](https://go.dev/blog/laws-of-reflection)
[^7]: [Effective Go - Goroutines](https://go.dev/doc/effective_go#goroutines)
[^8]: [runtime.GOMAXPROCS](https://pkg.go.dev/runtime#GOMAXPROCS)
[^9]: [Effective Go - Channels](https://go.dev/doc/effective_go#channels)
[^10]: [Language Spec - Receive operator](https://go.dev/ref/spec#Receive_operator)
[^11]: [Language Spec - Send statements](https://go.dev/ref/spec#Send_statements)
[^12]: [Language Spec - Close](https://go.dev/ref/spec#Close)
[^13]: [sync package](https://pkg.go.dev/sync)
[^14]: [sync/atomic package](https://pkg.go.dev/sync/atomic)
[^15]: [sync.Map type](https://pkg.go.dev/sync#Map)
[^16]: [context package](https://pkg.go.dev/context)
[^17]: [Go Blog - Context patterns](https://go.dev/blog/context)
[^18]: [Race detector](https://go.dev/doc/articles/race_detector)
[^19]: [Memory model](https://go.dev/ref/mem)
[^20]: [Go Blog](https://go.dev/blog/)
