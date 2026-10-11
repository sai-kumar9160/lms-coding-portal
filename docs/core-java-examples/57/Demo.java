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
        List<byte[]> cache = new ArrayList<>();
        cache.add(new byte[1024]);
        System.out.println(cache.size());
        cache.clear();
        System.out.println(cache.size());
    }
}
