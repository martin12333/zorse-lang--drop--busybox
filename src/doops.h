#ifndef DOOPS_H
#define DOOPS_H

#include <time.h>
#include <stdlib.h>
#include <errno.h>
#include <inttypes.h>
#include <string.h>

#include <poll.h>

#define DOOPS_SPINLOCK_TYPE int
#define DOOPS_MAX_SLEEP 500
#define DOOPS_MAX_EVENTS 1024

#if !defined(DOOPS_FREE) || !defined(DOOPS_MALLOC) || !defined(DOOPS_REALLOC)
#define DOOPS_MALLOC(bytes) malloc(bytes)
#define DOOPS_FREE(ptr) free(ptr)
#define DOOPS_REALLOC(ptr, size) realloc(ptr, size)
#endif

#include <sys/time.h>
#include <unistd.h>

#define DOOPS_READ 0
#define DOOPS_READWRITE 1

struct doops_loop;

#define LOOP_IS_READABLE(loop) (loop->io_read)
#define LOOP_IS_WRITABLE(loop) (loop->io_write)

#define loop_code(loop_ptr, code, interval) loop_code_data(loop_ptr, code, interval, NULL);
#define loop_schedule loop_code

typedef int (*doop_callback)(struct doops_loop *loop);
typedef int (*doop_foreach_callback)(struct doops_loop *loop, void *foreachdata);
typedef int (*doop_idle_callback)(struct doops_loop *loop);
typedef void (*doop_io_callback)(struct doops_loop *loop, int fd);
typedef void (*doop_udata_free_callback)(struct doops_loop *loop, void *ptr);

struct doops_event
{
    doop_callback event_callback;
    uint64_t when;
    uint64_t interval;
    void *user_data;
    struct doops_event *next;
};

struct doops_loop
{
    int quit;
    doop_idle_callback idle;
    struct doops_event *events;
    doop_io_callback io_read;
    doop_io_callback io_write;
    doop_udata_free_callback udata_free;
    struct pollfd *fds;
    int max_fd;
    void **udata;
    DOOPS_SPINLOCK_TYPE lock;
    int event_fd;
    unsigned int io_objects;
    void *event_data;
    struct doops_event *in_event;
    unsigned char reset_in_event;
    unsigned char io_wait;
};

static void _private_loop_init_io(struct doops_loop *loop)
{
    if (!loop)
        return;

    if (!loop->max_fd)
    {
        loop->fds = NULL;
    }
}

static uint64_t milliseconds()
{
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (uint64_t)(tv.tv_sec) * 1000 + (uint64_t)(tv.tv_usec) / 1000;
}

static void doops_lock(volatile DOOPS_SPINLOCK_TYPE *ptr)
{
    if (!ptr)
        return;
    while (__sync_lock_test_and_set(ptr, 1))
        while (*ptr)
            ;
}

static void doops_unlock(volatile DOOPS_SPINLOCK_TYPE *ptr)
{
    if (!ptr)
        return;
    __sync_lock_release(ptr);
}

static void loop_init(struct doops_loop *loop)
{
    if (loop)
    {
        memset(loop, 0, sizeof(struct doops_loop));
        loop->io_wait = 1;
    }
}

static struct doops_loop *loop_new()
{
    struct doops_loop *loop = (struct doops_loop *)DOOPS_MALLOC(sizeof(struct doops_loop));
    if (loop)
        loop_init(loop);
    return loop;
}

static int loop_add(struct doops_loop *loop, doop_callback callback, int64_t interval, void *user_data)
{
    if ((!callback) || (!loop))
    {
        errno = EINVAL;
        return -1;
    }

    struct doops_event *event_callback = (struct doops_event *)DOOPS_MALLOC(sizeof(struct doops_event));
    if (!event_callback)
    {
        errno = ENOMEM;
        return -1;
    }

    if (!loop->in_event)
        doops_lock(&loop->lock);
    event_callback->event_callback = callback;
    if (interval < 0)
        event_callback->interval = (uint64_t)(-interval);
    else
        event_callback->interval = (uint64_t)interval;
    event_callback->when = milliseconds() + interval;
    event_callback->user_data = user_data;
    event_callback->next = loop->events;

    loop->events = event_callback;
    if (loop->in_event)
        loop->reset_in_event = 2;
    else
        doops_unlock(&loop->lock);
    return 0;
}

static int loop_add_io_data(struct doops_loop *loop, int fd, int mode, void *userdata)
{
    if ((fd < 0) || (!loop))
    {
        errno = EINVAL;
        return -1;
    }
    int locked = 0;
    if (!loop->in_event)
    {
        doops_lock(&loop->lock);
        locked = 1;
    }
    _private_loop_init_io(loop);
    loop->fds = (struct pollfd *)DOOPS_REALLOC(loop->fds, sizeof(struct pollfd) * (loop->max_fd + 1));
    loop->fds[loop->max_fd].fd = fd;
    loop->fds[loop->max_fd].events = POLLIN | POLLPRI | POLLERR | POLLHUP | POLLNVAL;
    if (mode)
    {
        loop->fds[loop->max_fd].events |= POLLOUT;
        // write-only
        if (mode == 2)
            loop->fds[loop->max_fd].events &= ~POLLIN;
    }

    if ((userdata) || (loop->udata))
    {
        loop->udata = (void **)DOOPS_REALLOC(loop->udata, sizeof(void *) * (loop->max_fd + 1));
        if (loop->udata)
            loop->udata[loop->max_fd] = userdata;
    }
    loop->max_fd++;
    loop->io_objects++;
    if (locked)
        doops_unlock(&loop->lock);
    return 0;
}

static int loop_add_io(struct doops_loop *loop, int fd, int mode)
{
    return loop_add_io_data(loop, fd, mode, NULL);
}

static int loop_pause_write_io(struct doops_loop *loop, int fd)
{
    if (!loop)
    {
        errno = EINVAL;
        return -1;
    }
    int i;
    if (loop->fds)
    {
        for (i = 0; i < loop->max_fd; i++)
        {
            if (loop->fds[i].fd == fd)
            {
                loop->fds[i].events &= ~POLLOUT;
                break;
            }
        }
    }
    return 0;
}

static int loop_resume_write_io(struct doops_loop *loop, int fd)
{
    if (!loop)
    {
        errno = EINVAL;
        return -1;
    }
    int i;
    if (loop->fds)
    {
        for (i = 0; i < loop->max_fd; i++)
        {
            if (loop->fds[i].fd == fd)
            {
                loop->fds[i].events |= POLLOUT;
                break;
            }
        }
    }
    return 0;
}

static int loop_remove_io(struct doops_loop *loop, int fd)
{
    if ((fd < 0) || (!loop))
    {
        errno = EINVAL;
        return -1;
    }
    _private_loop_init_io(loop);
    if ((loop->max_fd) && (loop->fds))
    {
        int i;
        int found = 0;
        for (i = 0; i < loop->max_fd; i++)
        {
            if (loop->fds[i].fd == fd)
                found = 1;

            if ((found) && (i < loop->max_fd - 1))
            {
                loop->fds[i] = loop->fds[i + 1];
                if (loop->udata)
                    loop->udata[i] = loop->udata[i + 1];
            }
        }
        if (found)
            loop->max_fd--;
    }
    loop->io_objects--;
    return 0;
}

static int loop_remove(struct doops_loop *loop, doop_callback callback, void *user_data)
{
    if (!loop)
    {
        errno = EINVAL;
        return -1;
    }
    int locked = 0;
    if (!loop->in_event)
    {
        doops_lock(&loop->lock);
        locked = 1;
    }
    else if (!loop->reset_in_event)
        loop->reset_in_event = 2;
    int removed_event = 0;
    if ((loop->events) && (!loop->quit))
    {
        struct doops_event *ev = loop->events;
        struct doops_event *prev_ev = NULL;
        struct doops_event *next_ev = NULL;
        void *userdata = loop->event_data;
        while (ev)
        {
            next_ev = ev->next;
            if (((!callback) || (callback == ev->event_callback)) && ((!user_data) || (user_data == ev->user_data)))
            {
                if (loop->in_event == ev)
                {
                    // cannot delete current event, notify the loop
                    loop->reset_in_event = 1;
                }
                else
                {
                    if ((loop->udata_free) && (loop->events->user_data))
                    {
                        loop->event_data = loop->events->user_data;
                        loop->udata_free(loop, loop->events->user_data);
                    }
                    DOOPS_FREE(ev);
                    if (prev_ev)
                        prev_ev->next = next_ev;
                    else
                        loop->events = next_ev;
                    ev = next_ev;
                    if (ev)
                        next_ev = ev->next;
                }
                removed_event++;
                if ((callback) && (user_data))
                    break;
                continue;
            }
            prev_ev = ev;
            ev = next_ev;
        }
        loop->event_data = userdata;
    }
    if (locked)
        doops_unlock(&loop->lock);
    return removed_event;
}

static int loop_foreach_callback(struct doops_loop *loop, void *foreachcallback, doop_foreach_callback callback, void *foreachdata)
{
    if ((!loop) || (!callback))
    {
        errno = EINVAL;
        return -1;
    }
    doops_lock(&loop->lock);
    int removed_event = 0;
    if ((loop->events) && (!loop->quit))
    {
        struct doops_event *ev = loop->events;
        struct doops_event *prev_ev = NULL;
        struct doops_event *next_ev = NULL;
        void *userdata = loop->event_data;
        while ((ev) && (!loop->quit))
        {
            next_ev = ev->next;
            if ((ev->event_callback == foreachcallback) || (!foreachcallback))
            {
                loop->event_data = ev->user_data;
                int ret_code = callback(loop, foreachdata);
                if (ret_code < 0)
                    break;
                if (ret_code)
                {
                    if ((loop->udata_free) && (ev->user_data))
                        loop->udata_free(loop, ev->user_data);
                    DOOPS_FREE(ev);
                    if (prev_ev)
                        prev_ev->next = next_ev;
                    else
                        loop->events = next_ev;
                    ev = next_ev;
                    removed_event++;
                    if (ret_code != 1)
                        continue;
                }
            }
            prev_ev = ev;
            ev = next_ev;
        }
        loop->event_data = userdata;
    }
    doops_unlock(&loop->lock);
    return removed_event;
}

static int loop_foreach(struct doops_loop *loop, doop_foreach_callback callback, void *foreachdata)
{
    return loop_foreach_callback(loop, NULL, callback, foreachdata);
}

static void loop_quit(struct doops_loop *loop)
{
    if (loop)
        loop->quit = 1;
}

static int _private_loop_iterate(struct doops_loop *loop, int *sleep_val)
{
    int loops = 0;
    if (sleep_val)
        *sleep_val = DOOPS_MAX_SLEEP;
    doops_lock(&loop->lock);
    if ((loop->events) && (!loop->quit))
    {
        struct doops_event *ev = loop->events;
        struct doops_event *prev_ev = NULL;
        struct doops_event *next_ev = NULL;
        while ((ev) && (!loop->quit))
        {
            next_ev = ev->next;
            uint64_t now = milliseconds();
            if (ev->when <= now)
            {
                loops++;
                loop->event_data = ev->user_data;
                int remove_event = 1;
                loop->in_event = ev;
                loop->reset_in_event = 0;
                if (ev->event_callback)
                    remove_event = ev->event_callback(loop);
                // remove_event called on the current event
                if (loop->reset_in_event)
                {
                    next_ev = ev->next;
                    prev_ev = NULL;
                    struct doops_event *ev_2 = loop->events;
                    while ((ev_2) && (ev != ev_2))
                    {
                        prev_ev = ev_2;
                        ev_2 = ev_2->next;
                    }

                    if (loop->reset_in_event == 1)
                        remove_event = 1;
                    loop->reset_in_event = 0;

                    *sleep_val = 0;
                }
                loop->in_event = NULL;
                if (remove_event)
                {
                    if ((loop->udata_free) && (ev->user_data))
                        loop->udata_free(loop, ev->user_data);
                    DOOPS_FREE(ev);
                    if (prev_ev)
                        prev_ev->next = next_ev;
                    else
                        loop->events = next_ev;
                    ev = next_ev;
                    continue;
                }
                while ((ev->when <= now) && (ev->interval))
                    ev->when += ev->interval;
            }
            if (sleep_val)
            {
                int delta = (int)(ev->when - now);
                if (delta < *sleep_val)
                    *sleep_val = delta;
            }
            prev_ev = ev;
            ev = next_ev;
        }
        if (!loop->events)
            *sleep_val = 0;
    }
    doops_unlock(&loop->lock);
    return loops;
}

static int loop_iterate(struct doops_loop *loop)
{
    return _private_loop_iterate(loop, NULL);
}

static int loop_idle(struct doops_loop *loop, doop_idle_callback callback)
{
    if (!loop)
    {
        errno = EINVAL;
        return -1;
    }
    loop->idle = callback;
    return 0;
}

static int loop_io(struct doops_loop *loop, doop_io_callback read_callback, doop_io_callback write_callback)
{
    if (!loop)
    {
        errno = EINVAL;
        return -1;
    }
    loop->io_read = read_callback;
    loop->io_write = write_callback;
    return 0;
}

static void _private_loop_remove_events(struct doops_loop *loop)
{
    struct doops_event *next_ev;
    doops_lock(&loop->lock);
    while (loop->events)
    {
        next_ev = loop->events->next;
        if ((loop->udata_free) && (loop->events->user_data))
        {
            loop->event_data = loop->events->user_data;
            loop->udata_free(loop, loop->events->user_data);
        }
        DOOPS_FREE(loop->events);
        loop->events = next_ev;
    }
    if (loop->udata)
    {
        DOOPS_FREE(loop->udata);
        loop->udata = NULL;
    }
    loop->max_fd = 1;
    doops_unlock(&loop->lock);
}

static void _private_sleep(struct doops_loop *loop, int sleep_val)
{
    if (!loop)
        return;
    if ((loop->max_fd) && ((LOOP_IS_READABLE(loop)) || (LOOP_IS_WRITABLE(loop))))
    {
        int err = poll(loop->fds, loop->max_fd, sleep_val);
        if (err >= 0)
        {
            if (!err)
                return;
            int i;
            for (i = 0; i < loop->max_fd; i++)
            {
                if (LOOP_IS_READABLE(loop))
                {
                    if (loop->fds[i].revents & ~POLLOUT)
                    {
                        loop->event_fd = loop->fds[i].fd;
                        loop->event_data = loop->udata ? loop->udata[i] : NULL;
                        loop->io_read(loop, loop->fds[i].fd);
                    }
                }
                if (LOOP_IS_WRITABLE(loop))
                {
                    if (loop->fds[i].revents & POLLOUT)
                    {
                        loop->event_fd = loop->fds[i].fd;
                        loop->event_data = loop->udata ? loop->udata[i] : NULL;
                        loop->io_write(loop, loop->fds[i].fd);
                    }
                }
            }
        }
    }
    else
        usleep(sleep_val * 1000);
}

static void loop_io_wait(struct doops_loop *loop, unsigned char wait)
{
    if (loop)
        loop->io_wait = wait;
}

static void loop_run(struct doops_loop *loop)
{
    if (!loop)
        return;

    int sleep_val;
    while (((loop->events) || ((loop->io_wait) && (loop->io_objects))) && (!loop->quit))
    {
        loop->event_fd = -1;
        int loops = _private_loop_iterate(loop, &sleep_val);
        loop->event_data = NULL;
        if ((sleep_val > 0) && (!loops) && (loop->idle) && (loop->idle(loop)))
            break;
        _private_sleep(loop, sleep_val);
    }
    _private_loop_remove_events(loop);
    loop->quit = 1;
}

static void loop_deinit(struct doops_loop *loop)
{
    if (loop)
    {
        DOOPS_FREE(loop->fds);
        DOOPS_FREE(loop->udata);
        loop->fds = NULL;
        loop->udata = NULL;
        loop->max_fd = 0;
        _private_loop_remove_events(loop);
    }
}

static void loop_free(struct doops_loop *loop)
{
    loop_deinit(loop);
    DOOPS_FREE(loop);
}

static int loop_event_socket(struct doops_loop *loop)
{
    if (loop)
        return loop->event_fd;
    return -1;
}

static void *loop_event_data(struct doops_loop *loop)
{
    if (loop)
        return loop->event_data;
    return NULL;
}

#endif
