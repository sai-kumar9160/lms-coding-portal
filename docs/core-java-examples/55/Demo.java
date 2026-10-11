import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.sql.*;

public class Demo {
    public static void main(String[] args) throws Exception {
        AtomicInteger count = new AtomicInteger();
        Runnable task = () -> { for (int i = 0; i < 1000; i++) count.incrementAndGet(); };
        Thread first = new Thread(task);
        Thread second = new Thread(task);
        first.start(); second.start();
        first.join(); second.join();
        System.out.println(count.get());
    }
}
